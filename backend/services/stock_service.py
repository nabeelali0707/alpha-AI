import asyncio
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from functools import lru_cache
from typing import Dict, List, Any, Optional

import pandas as pd
from fastapi import HTTPException
from utils.cache import cache_get, cache_set

logger = logging.getLogger("alphaai.stock_service")

# ---------------------------------------------------------------------------
# Global rate-limit awareness for Yahoo Finance
# ---------------------------------------------------------------------------
YAHOO_RATE_LIMITED = False
YAHOO_RATE_LIMIT_UNTIL: float = 0

# In-memory price cache keyed by symbol – survives across requests so we can
# return stale data when Yahoo is down or rate-limited.
PSX_PRICE_CACHE: Dict[str, Dict[str, Any]] = {}

MARKET_TICKERS = {
    "PSX": {
        "ENGRO.KA": "Engro Corporation",
        "HBL.KA": "Habib Bank",
        "LUCK.KA": "Lucky Cement",
        "OGDC.KA": "Oil & Gas Dev Corp",
        "PPL.KA": "Pakistan Petroleum",
        "PSO.KA": "Pakistan State Oil",
        "MCB.KA": "MCB Bank",
        "UBL.KA": "United Bank",
        "HUBC.KA": "Hub Power",
        "KEL.KA": "K-Electric",
        "PAKT.KA": "Pakistan Tobacco",
        "SEARL.KA": "Searle Pakistan",
        "TRG.KA": "TRG Pakistan",
        "SYS.KA": "Systems Ltd",
        "NETSOL.KA": "NetSol Technologies",
    },
    "US": {
        "AAPL": "Apple",
        "MSFT": "Microsoft",
        "NVDA": "NVIDIA",
        "GOOGL": "Alphabet",
        "AMZN": "Amazon",
        "META": "Meta",
        "TSLA": "Tesla",
        "AMD": "AMD",
        "PLTR": "Palantir",
        "NFLX": "Netflix",
        "UBER": "Uber",
        "SPOT": "Spotify",
    },
    "CRYPTO": {
        "BTC-USD": "Bitcoin",
        "ETH-USD": "Ethereum",
        "BNB-USD": "BNB",
        "SOL-USD": "Solana",
        "ADA-USD": "Cardano",
        "XRP-USD": "XRP",
        "DOGE-USD": "Dogecoin",
        "MATIC-USD": "Polygon",
        "LINK-USD": "Chainlink",
        "LTC-USD": "Litecoin",
        "BCH-USD": "Bitcoin Cash",
        "XLM-USD": "Stellar",
    },
    "FOREX": {
        "PKR=X": "USD/PKR",
        "EURUSD=X": "EUR/USD",
        "GBPUSD=X": "GBP/USD",
        "JPYUSD=X": "JPY/USD",
        "CHFUSD=X": "CHF/USD",
        "AUDUSD=X": "AUD/USD",
        "CADUSD=X": "CAD/USD",
        "INRUSD=X": "INR/USD",
        "SGDUSD=X": "SGD/USD",
        "HKDUSD=X": "HKD/USD",
    },
    "COMMODITIES": {
        "GC=F": "Gold",
        "SI=F": "Silver",
        "CL=F": "Crude Oil",
        "NG=F": "Natural Gas",
        "ZW=F": "Wheat",
        "ZC=F": "Corn",
        "CC=F": "Cocoa",
        "CT=F": "Cotton",
    },
    "INDICES": {
        "^GSPC": "S&P 500",
        "^DJI": "Dow Jones",
        "^IXIC": "NASDAQ",
        "^FTSE": "FTSE 100",
        "^N225": "Nikkei 225",
        "^HSI": "Hang Seng",
        "^AORD": "ASX 200",
        "^KS11": "KOSPI",
    },
}

# ---------------------------------------------------------------------------
# Helpers — Supabase local PSX data
# ---------------------------------------------------------------------------

def _get_from_supabase_psx(symbol: str) -> Optional[Dict[str, Any]]:
    """Try to fetch a PSX stock row from the Supabase psx_stocks table."""
    try:
        from utils.supabase_client import get_supabase_client

        sb = get_supabase_client()
        if not sb:
            return None

        clean_symbol = symbol.replace(".KA", "")
        result = (
            sb.table("psx_stocks")
            .select("*")
            .or_(f"symbol.eq.{symbol},symbol.eq.{clean_symbol}")
            .limit(1)
            .execute()
        )
        rows = getattr(result, "data", None) or []
        if not rows:
            return None

        row = rows[0]
        price = row.get("last_price")
        if price is None:
            return None

        return {
            "symbol": symbol.upper(),
            "name": row.get("name") or MARKET_TICKERS["PSX"].get(symbol, symbol),
            "price": round(float(price), 2),
            "change": 0.0,
            "change_percent": 0.0,
            "volume": 0,
            "timestamp": row.get("last_date") or datetime.now().isoformat(),
        }
    except Exception as exc:
        logger.debug("Supabase PSX lookup failed for %s: %s", symbol, exc)
        return None


# ---------------------------------------------------------------------------
# Safe PSX fetcher — priority chain: Supabase → yfinance (fast_info) → cache
# ---------------------------------------------------------------------------

def get_psx_stock_safe(symbol: str) -> Dict[str, Any]:
    """
    Fetch a PSX stock price using a resilient priority chain:
      1. Supabase psx_stocks table (instant, local)
      2. yfinance fast_info with exponential backoff (lightweight)
      3. In-memory cache / placeholder
    """
    global YAHOO_RATE_LIMITED, YAHOO_RATE_LIMIT_UNTIL

    # ── Priority 1: Supabase local data ──────────────────────────────────
    try:
        local = _get_from_supabase_psx(symbol)
        if local and local.get("price"):
            local["source"] = "local"
            local["is_cached"] = False
            # Warm the in-memory cache so Priority 3 has data later
            PSX_PRICE_CACHE[symbol] = local
            return local
    except Exception:
        pass

    # ── Check global rate-limit flag before touching Yahoo ───────────────
    if YAHOO_RATE_LIMITED and time.time() < YAHOO_RATE_LIMIT_UNTIL:
        cached = PSX_PRICE_CACHE.get(symbol)
        if cached:
            return {**cached, "source": "cache", "is_cached": True}
        return _psx_placeholder(symbol)

    if YAHOO_RATE_LIMITED and time.time() >= YAHOO_RATE_LIMIT_UNTIL:
        YAHOO_RATE_LIMITED = False

    # ── Priority 2: yfinance with retry + backoff ────────────────────────
    try:
        import yfinance as yf
    except Exception:
        yf = None

    if yf is not None:
        for attempt in range(3):
            try:
                if attempt > 0:
                    time.sleep(attempt * 2)  # 0s, 2s, 4s backoff

                ticker = yf.Ticker(symbol)
                fi = ticker.fast_info  # lightweight — one request vs 10+

                last_price = getattr(fi, "last_price", None)
                if last_price is None:
                    # Try attribute-style access for older yfinance
                    try:
                        last_price = fi["last_price"]
                    except (KeyError, TypeError):
                        pass

                if last_price:
                    prev = getattr(fi, "previous_close", None) or last_price
                    change = float(last_price) - float(prev)
                    change_pct = (change / float(prev) * 100) if prev else 0.0
                    payload = {
                        "symbol": symbol.upper(),
                        "name": MARKET_TICKERS["PSX"].get(symbol, symbol),
                        "price": round(float(last_price), 2),
                        "change": round(change, 2),
                        "change_percent": round(change_pct, 2),
                        "volume": 0,
                        "timestamp": datetime.now().isoformat(),
                        "source": "yfinance",
                        "is_cached": False,
                    }
                    PSX_PRICE_CACHE[symbol] = payload
                    return payload

            except Exception as e:
                if "429" in str(e):
                    YAHOO_RATE_LIMITED = True
                    YAHOO_RATE_LIMIT_UNTIL = time.time() + 300  # 5-min cooldown
                    logger.warning("Yahoo 429 for %s — backing off 5 min", symbol)
                    time.sleep(10)
                continue

    # ── Priority 3: cached value or placeholder ──────────────────────────
    cached = PSX_PRICE_CACHE.get(symbol)
    if cached:
        return {**cached, "source": "cache", "is_cached": True}

    return _psx_placeholder(symbol)


def _psx_placeholder(symbol: str) -> Dict[str, Any]:
    return {
        "symbol": symbol.upper(),
        "name": MARKET_TICKERS["PSX"].get(symbol, symbol),
        "price": None,
        "change": 0.0,
        "change_percent": 0.0,
        "volume": 0,
        "timestamp": datetime.now().isoformat(),
        "error": "Data temporarily unavailable",
        "is_cached": True,
        "source": "none",
    }


# ---------------------------------------------------------------------------
# Rate-limit–aware wrapper (used by market overview for ANY ticker)
# ---------------------------------------------------------------------------

def fetch_with_rate_limit_awareness(symbol: str) -> Optional[Dict[str, Any]]:
    """Return cached data immediately when Yahoo is rate-limited."""
    global YAHOO_RATE_LIMITED, YAHOO_RATE_LIMIT_UNTIL

    if YAHOO_RATE_LIMITED:
        if time.time() < YAHOO_RATE_LIMIT_UNTIL:
            return PSX_PRICE_CACHE.get(symbol)
        else:
            YAHOO_RATE_LIMITED = False

    # For PSX tickers, delegate to the safe fetcher
    if symbol.endswith(".KA"):
        try:
            return get_psx_stock_safe(symbol)
        except Exception as e:
            if "429" in str(e):
                YAHOO_RATE_LIMITED = True
                YAHOO_RATE_LIMIT_UNTIL = time.time() + 300
            raise

    return None  # non-PSX tickers fall through to normal path


# ═══════════════════════════════════════════════════════════════════════════
# StockService
# ═══════════════════════════════════════════════════════════════════════════

class StockService:
    @staticmethod
    def get_stock_price(ticker: str) -> Dict[str, Any]:
        """
        Fetches the current market price and 24h change for a given ticker.
        """
        global YAHOO_RATE_LIMITED, YAHOO_RATE_LIMIT_UNTIL
        try:
            cache_key = ticker.upper()
            cached = cache_get(f"stock:price:{cache_key}")
            if cached is not None:
                return cached

            # PSX tickers get the resilient path
            if ticker.endswith(".KA"):
                result = get_psx_stock_safe(ticker)
                cache_set(f"stock:price:{cache_key}", result, ttl=60)
                return result

            # Check global rate-limit before hitting Yahoo
            if YAHOO_RATE_LIMITED and time.time() < YAHOO_RATE_LIMIT_UNTIL:
                raise ValueError("Yahoo rate-limited — using cache")

            try:
                import yfinance as yf
            except Exception:
                yf = None

            if yf is None:
                raise ValueError("yfinance is not available in the current runtime")

            stock = yf.Ticker(ticker)

            # Try multiple info sources for robustness
            price = None
            prev_close = None

            # 1) fast_info (lightweight — one request)
            try:
                fi = stock.fast_info
                price = getattr(fi, "last_price", None)
                prev_close = getattr(fi, "previous_close", None)
            except Exception as e:
                if "429" in str(e):
                    YAHOO_RATE_LIMITED = True
                    YAHOO_RATE_LIMIT_UNTIL = time.time() + 300
                price = None

            # 2) Single history fallback (skip stock.info — too heavy)
            if price is None:
                try:
                    hist = stock.history(period="5d")
                    if hist is not None and not hist.empty:
                        price = hist['Close'].iloc[-1]
                        if len(hist) >= 2:
                            prev_close = hist['Close'].iloc[-2]
                except Exception as e:
                    if "429" in str(e):
                        YAHOO_RATE_LIMITED = True
                        YAHOO_RATE_LIMIT_UNTIL = time.time() + 300

            if price is None:
                raise ValueError(f"No price data found for {ticker}")

            if prev_close is None:
                prev_close = price

            change = float(price) - float(prev_close)
            change_percent = (change / float(prev_close)) * 100 if prev_close else 0
            payload = {
                "symbol": ticker.upper(),
                "price": round(float(price), 2),
                "change": round(float(change), 2),
                "change_percent": round(float(change_percent), 2),
                "timestamp": datetime.now().isoformat()
            }
            cache_set(f"stock:price:{cache_key}", payload, ttl=30)
            return payload
        except Exception:
            fallback = {
                "symbol": ticker.upper(),
                "price": 0.0,
                "change": 0.0,
                "change_percent": 0.0,
                "timestamp": datetime.now().isoformat()
            }
            # Cache fallback for longer to avoid hammering yfinance on repeated failures.
            cache_set(f"stock:price:{ticker.upper()}", fallback, ttl=180)
            return fallback

    @staticmethod
    def get_stock_history(ticker: str, period: str = "1mo", interval: str = "1d") -> List[Dict[str, Any]]:
        """
        Fetches historical price data. 
        Periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        """
        global YAHOO_RATE_LIMITED, YAHOO_RATE_LIMIT_UNTIL
        try:
            cache_key = f"{ticker.upper()}|{period}|{interval}"
            cached = cache_get(f"stock:history:{cache_key}")
            if cached is not None:
                return cached

            # Skip when Yahoo is rate-limited
            if YAHOO_RATE_LIMITED and time.time() < YAHOO_RATE_LIMIT_UNTIL:
                return []

            try:
                import yfinance as yf
            except Exception:
                return []

            stock = yf.Ticker(ticker)
            hist = stock.history(period=period, interval=interval)
            
            if hist.empty:
                return []

            # Reset index to get Date as a column
            hist = hist.reset_index()
            
            # Convert to list of dicts for JSON serialization
            data = []
            for _, row in hist.iterrows():
                data.append({
                    "date": row['Date'].strftime('%Y-%m-%d %H:%M:%S') if isinstance(row['Date'], datetime) else str(row['Date']),
                    "open": round(float(row['Open']), 2),
                    "high": round(float(row['High']), 2),
                    "low": round(float(row['Low']), 2),
                    "close": round(float(row['Close']), 2),
                    "volume": int(row['Volume'])
                })
            cache_set(f"stock:history:{cache_key}", data, ttl=300)
            return data
        except Exception:
            return []

    @staticmethod
    def get_stock_info(ticker: str) -> Dict[str, Any]:
        """
        Fetches comprehensive company metadata and fundamentals.
        """
        global YAHOO_RATE_LIMITED, YAHOO_RATE_LIMIT_UNTIL
        _empty_info = {
            "symbol": ticker.upper(),
            "name": None,
            "sector": None,
            "industry": None,
            "market_cap": None,
            "pe_ratio": None,
            "dividend_yield": None,
            "fifty_two_week_high": None,
            "fifty_two_week_low": None,
            "description": None,
            "website": None
        }
        try:
            cache_key = ticker.upper()
            cached = cache_get(f"stock:info:{cache_key}")
            if cached is not None:
                return cached

            # For PSX tickers, return basic info from local map to avoid
            # triggering ticker.info (heavy, 10+ requests, often 429s).
            if ticker.endswith(".KA"):
                psx_info = {
                    **_empty_info,
                    "name": MARKET_TICKERS["PSX"].get(ticker, ticker),
                }
                cache_set(f"stock:info:{cache_key}", psx_info, ttl=3600)
                return psx_info

            # Skip heavy stock.info call when Yahoo is rate-limited
            if YAHOO_RATE_LIMITED and time.time() < YAHOO_RATE_LIMIT_UNTIL:
                cache_set(f"stock:info:{cache_key}", _empty_info, ttl=180)
                return _empty_info

            try:
                import yfinance as yf
            except Exception:
                return _empty_info

            stock = yf.Ticker(ticker)
            try:
                info = stock.info
            except Exception as e:
                if "429" in str(e):
                    YAHOO_RATE_LIMITED = True
                    YAHOO_RATE_LIMIT_UNTIL = time.time() + 300
                cache_set(f"stock:info:{cache_key}", _empty_info, ttl=180)
                return _empty_info
            
            if not info or 'symbol' not in info and 'longName' not in info:
                return _empty_info

            payload = {
                "symbol": info.get("symbol", ticker.upper()),
                "name": info.get("longName"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "market_cap": info.get("marketCap"),
                "pe_ratio": info.get("trailingPE"),
                "dividend_yield": info.get("dividendYield"),
                "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
                "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
                "description": info.get("longBusinessSummary"),
                "website": info.get("website")
            }
            cache_set(f"stock:info:{cache_key}", payload, ttl=3600)
            return payload
        except Exception:
            return _empty_info

    @staticmethod
    def get_financials(ticker: str) -> Dict[str, Any]:
        """
        Fetches the company's financial statements:
        income statement, balance sheet, and cash flow.
        """
        try:
            try:
                import yfinance as yf
            except Exception:
                raise HTTPException(status_code=404, detail="yfinance is not available in the current runtime")

            stock = yf.Ticker(ticker)

            def _df_to_dict(df: pd.DataFrame) -> Dict[str, Any]:
                """Convert a financials DataFrame to a JSON-safe dict."""
                if df is None or df.empty:
                    return {}
                # Columns are dates; rows are line items
                result = {}
                for col in df.columns:
                    key = col.strftime("%Y-%m-%d") if hasattr(col, "strftime") else str(col)
                    result[key] = {
                        str(idx): (None if pd.isna(val) else float(val))
                        for idx, val in df[col].items()
                    }
                return result

            return {
                "symbol": ticker.upper(),
                "income_statement": _df_to_dict(stock.financials),
                "balance_sheet": _df_to_dict(stock.balance_sheet),
                "cash_flow": _df_to_dict(stock.cashflow),
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"Error fetching financials for {ticker}: {str(e)}",
            )

    @staticmethod
    def get_corporate_actions(ticker: str) -> Dict[str, Any]:
        """
        Fetches historical dividends and stock splits.
        """
        try:
            try:
                import yfinance as yf
            except Exception:
                raise HTTPException(status_code=404, detail="yfinance is not available in the current runtime")

            stock = yf.Ticker(ticker)

            def _series_to_dict(series: pd.Series) -> Dict[str, Any]:
                """Convert a pandas Series with DatetimeIndex to a JSON-safe dict."""
                if series is None or series.empty:
                    return {}
                return {
                    idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx): float(val)
                    for idx, val in series.items()
                }

            return {
                "symbol": ticker.upper(),
                "dividends": _series_to_dict(stock.dividends),
                "splits": _series_to_dict(stock.splits),
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"Error fetching corporate actions for {ticker}: {str(e)}",
            )

    @staticmethod
    def _fetch_market_item(ticker: str, name: str) -> Optional[Dict[str, Any]]:
        """Fetch a single market item with rate-limit awareness."""
        global YAHOO_RATE_LIMITED, YAHOO_RATE_LIMIT_UNTIL

        # PSX tickers use the resilient safe fetcher
        if ticker.endswith(".KA"):
            result = get_psx_stock_safe(ticker)
            if result and result.get("price") is not None:
                return {
                    "symbol": ticker,
                    "name": name,
                    "price": result["price"],
                    "change": result.get("change", 0.0),
                    "change_percent": result.get("change_percent", 0.0),
                    "volume": result.get("volume", 0),
                    "is_cached": result.get("is_cached", False),
                    "source": result.get("source", "unknown"),
                }
            return None

        # Non-PSX: check rate limit then use yfinance normally
        if YAHOO_RATE_LIMITED and time.time() < YAHOO_RATE_LIMIT_UNTIL:
            return None

        try:
            import yfinance as yf
        except Exception:
            return None

        try:
            stock = yf.Ticker(ticker)
            fi = stock.fast_info
            price = getattr(fi, "last_price", None)
            if price is None:
                return None

            prev = getattr(fi, "previous_close", None) or price
            change = float(price) - float(prev)
            pct = (change / float(prev) * 100) if prev else 0.0
            return {
                "symbol": ticker,
                "name": name,
                "price": round(float(price), 2),
                "change": round(change, 2),
                "change_percent": round(pct, 2),
                "volume": 0,
            }
        except Exception as exc:
            if "429" in str(exc):
                YAHOO_RATE_LIMITED = True
                YAHOO_RATE_LIMIT_UNTIL = time.time() + 300
                logger.warning("Yahoo 429 on %s — global cooldown 5 min", ticker)
            return None

    @staticmethod
    @lru_cache(maxsize=4)
    def _cached_market_overview(ttl_bucket: int) -> Dict[str, List[Dict[str, Any]]]:
        results: Dict[str, List[Dict[str, Any]]] = {k: [] for k in MARKET_TICKERS.keys()}

        # Skip entirely when Yahoo is rate-limited
        if YAHOO_RATE_LIMITED and time.time() < YAHOO_RATE_LIMIT_UNTIL:
            logger.info("Market overview skipped — Yahoo rate-limited")
            return results

        # Limit to 2 concurrent workers to reduce Yahoo pressure
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_map = {}
            for category, tickers in MARKET_TICKERS.items():
                for symbol, name in tickers.items():
                    future = executor.submit(StockService._fetch_market_item, symbol, name)
                    future_map[future] = category

            for future in as_completed(future_map):
                category = future_map[future]
                try:
                    item = future.result()
                    if item:
                        results[category].append(item)
                except Exception as exc:
                    logger.warning("Market overview fetch failed: %s", exc)

        return results

    @staticmethod
    def get_market_overview() -> Dict[str, List[Dict[str, Any]]]:
        cached = cache_get("market:overview")
        if cached is not None:
            return cached

        ttl_bucket = int(time.time() // 300)  # 5-minute buckets
        data = StockService._cached_market_overview(ttl_bucket)
        cache_set("market:overview", data, ttl=300)  # cache 5 min
        return data

    @staticmethod
    def get_market_category(category: str) -> List[Dict[str, Any]]:
        overview = StockService.get_market_overview()
        return overview.get(category.upper(), [])

    @staticmethod
    def search_autocomplete(query: str, limit: int = 10) -> List[Dict[str, Any]]:
        cache_key = query.strip().lower()
        cached = cache_get(f"stock:autocomplete:{cache_key}")
        if cached is not None:
            return cached

        results: List[Dict[str, Any]] = []
        normalized = query.strip().lower()

        # PSX local search first
        for symbol, name in MARKET_TICKERS.get("PSX", {}).items():
            if normalized in symbol.lower() or normalized in name.lower():
                results.append({"symbol": symbol, "name": name, "market": "PSX"})
                if len(results) >= limit:
                    cache_set(f"stock:autocomplete:{cache_key}", results, ttl=300)
                    return results

        # yfinance search fallback
        try:
            import yfinance as yf

            if hasattr(yf, "Search"):
                search = yf.Search(query)
                for item in (search.quotes or []):
                    symbol = item.get("symbol")
                    name = item.get("shortname") or item.get("longname") or item.get("name") or symbol
                    exchange = item.get("exchange") or item.get("exchDisp") or "US"
                    if symbol and all(r["symbol"] != symbol for r in results):
                        results.append({"symbol": symbol, "name": name or symbol, "market": exchange})
                    if len(results) >= limit:
                        break
        except Exception as exc:
            logger.warning("Autocomplete fallback failed: %s", exc)

        cache_set(f"stock:autocomplete:{cache_key}", results[:limit], ttl=300)
        return results[:limit]
