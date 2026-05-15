import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional
from fastapi import HTTPException

class StockService:
    @staticmethod
    def get_stock_price(ticker: str) -> Dict[str, Any]:
        """
        Fetches the current market price and 24h change for a given ticker.
        """
        try:
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

            return {
                "symbol": ticker.upper(),
                "price": round(float(price), 2),
                "change": round(float(change), 2),
                "change_percent": round(float(change_percent), 2),
                "timestamp": datetime.now().isoformat()
            }
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
            return data
        except Exception:
            return []

    @staticmethod
    def get_stock_info(ticker: str) -> Dict[str, Any]:
        """
        Fetches comprehensive company metadata and fundamentals.
        """
        try:
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

            return {
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
