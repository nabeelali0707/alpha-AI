import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from functools import lru_cache
from typing import Dict, List, Any, Optional

import pandas as pd
from cachetools import TTLCache
from fastapi import HTTPException

logger = logging.getLogger("alphaai.stock_service")

PRICE_CACHE = TTLCache(maxsize=500, ttl=30)
HISTORY_CACHE = TTLCache(maxsize=200, ttl=300)
INFO_CACHE = TTLCache(maxsize=500, ttl=3600)
MARKET_CACHE = TTLCache(maxsize=1, ttl=60)
AUTOCOMPLETE_CACHE = TTLCache(maxsize=200, ttl=300)

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

class StockService:
    @staticmethod
    def get_stock_price(ticker: str) -> Dict[str, Any]:
        """
        Fetches the current market price and 24h change for a given ticker.
        """
        try:
            cache_key = ticker.upper()
            cached = PRICE_CACHE.get(cache_key)
            if cached:
                return cached

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

            # 1) fast_info (yfinance newer API)
            fast_info = getattr(stock, "fast_info", None)
            if fast_info:
                try:
                    info = stock.fast_info
                    price = info.get("last_price") or info.get("last")
                    prev_close = info.get("previous_close") or info.get("previousClose")
                except Exception:
                    price = None

            # 2) stock.info
            if price is None:
                try:
                    info2 = stock.info
                    price = info2.get("regularMarketPrice") or info2.get("currentPrice") or info2.get("last_price")
                    prev_close = info2.get("previousClose") or info2.get("previous_close")
                except Exception:
                    price = None

            # 3) history fallbacks: try 1d, then 5d, then 1mo
            if price is None:
                for p in ("1d", "5d", "7d", "1mo"):
                    hist = stock.history(period=p)
                    if hist is not None and not hist.empty:
                        price = hist['Close'].iloc[-1]
                        break

            if price is None:
                raise ValueError(f"No price data found for {ticker}")

            if prev_close is None:
                # try to derive previous close from history if missing
                try:
                    hist2 = stock.history(period="5d")
                    if hist2 is not None and len(hist2) >= 2:
                        prev_close = hist2['Close'].iloc[-2]
                except Exception:
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
            PRICE_CACHE[cache_key] = payload
            return payload
        except Exception:
            return {
                "symbol": ticker.upper(),
                "price": 0.0,
                "change": 0.0,
                "change_percent": 0.0,
                "timestamp": datetime.now().isoformat()
            }

    @staticmethod
    def get_stock_history(ticker: str, period: str = "1mo", interval: str = "1d") -> List[Dict[str, Any]]:
        """
        Fetches historical price data. 
        Periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        """
        try:
            cache_key = f"{ticker.upper()}|{period}|{interval}"
            cached = HISTORY_CACHE.get(cache_key)
            if cached is not None:
                return cached

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
            HISTORY_CACHE[cache_key] = data
            return data
        except Exception:
            return []

    @staticmethod
    def get_stock_info(ticker: str) -> Dict[str, Any]:
        """
        Fetches comprehensive company metadata and fundamentals.
        """
        try:
            cache_key = ticker.upper()
            cached = INFO_CACHE.get(cache_key)
            if cached is not None:
                return cached

            try:
                import yfinance as yf
            except Exception:
                return {
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

            stock = yf.Ticker(ticker)
            info = stock.info
            
            if not info or 'symbol' not in info and 'longName' not in info:
                return {
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
            INFO_CACHE[cache_key] = payload
            return payload
        except Exception:
            return {
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
        try:
            import yfinance as yf
        except Exception as exc:
            logger.warning("yfinance unavailable for %s: %s", ticker, exc)
            return None

        try:
            stock = yf.Ticker(ticker)
            fast_info = getattr(stock, "fast_info", None)
            price = None
            prev_close = None
            volume = None

            if fast_info:
                try:
                    info = stock.fast_info
                    price = info.get("last_price") or info.get("last")
                    prev_close = info.get("previous_close") or info.get("previousClose")
                    volume = info.get("volume")
                except Exception:
                    price = None

            if price is None:
                return None

            change = float(price) - float(prev_close) if prev_close else 0.0
            change_percent = (change / float(prev_close)) * 100 if prev_close else 0.0

            return {
                "symbol": ticker,
                "name": name,
                "price": round(float(price), 4),
                "change": round(float(change), 4),
                "change_percent": round(float(change_percent), 2),
                "volume": int(volume) if volume is not None else None,
            }
        except Exception as exc:
            logger.warning("Failed to fetch %s: %s", ticker, exc)
            return None

    @staticmethod
    @lru_cache(maxsize=4)
    def _cached_market_overview(ttl_bucket: int) -> Dict[str, List[Dict[str, Any]]]:
        results: Dict[str, List[Dict[str, Any]]] = {k: [] for k in MARKET_TICKERS.keys()}

        with ThreadPoolExecutor(max_workers=20) as executor:
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
        cached = MARKET_CACHE.get("overview")
        if cached is not None:
            return cached

        ttl_bucket = int(time.time() // 60)
        data = StockService._cached_market_overview(ttl_bucket)
        MARKET_CACHE["overview"] = data
        return data

    @staticmethod
    def get_market_category(category: str) -> List[Dict[str, Any]]:
        overview = StockService.get_market_overview()
        return overview.get(category.upper(), [])

    @staticmethod
    def search_autocomplete(query: str, limit: int = 10) -> List[Dict[str, Any]]:
        cache_key = query.strip().lower()
        cached = AUTOCOMPLETE_CACHE.get(cache_key)
        if cached is not None:
            return cached

        results: List[Dict[str, Any]] = []
        normalized = query.strip().lower()

        # PSX local search first
        for symbol, name in MARKET_TICKERS.get("PSX", {}).items():
            if normalized in symbol.lower() or normalized in name.lower():
                results.append({"symbol": symbol, "name": name, "market": "PSX"})
                if len(results) >= limit:
                    AUTOCOMPLETE_CACHE[cache_key] = results
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

        AUTOCOMPLETE_CACHE[cache_key] = results[:limit]
        return results[:limit]
