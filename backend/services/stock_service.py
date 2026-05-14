import yfinance as yf
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
            stock = yf.Ticker(ticker)
            # Use fast_info if available, else history
            info = stock.basic_info
            
            if not info or info.get('last_price') is None:
                 # Fallback to history if basic_info fails
                 hist = stock.history(period="1d")
                 if hist.empty:
                     raise ValueError(f"No price data found for {ticker}")
                 price = hist['Close'].iloc[-1]
                 prev_close = stock.info.get('previousClose', price)
            else:
                price = info['last_price']
                prev_close = info.get('previous_close', price)

            change = price - prev_close
            change_percent = (change / prev_close) * 100 if prev_close else 0

            return {
                "symbol": ticker.upper(),
                "price": round(float(price), 2),
                "change": round(float(change), 2),
                "change_percent": round(float(change_percent), 2),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Error fetching price for {ticker}: {str(e)}")

    @staticmethod
    def get_stock_history(ticker: str, period: str = "1mo", interval: str = "1d") -> List[Dict[str, Any]]:
        """
        Fetches historical price data. 
        Periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        """
        try:
            stock = yf.Ticker(ticker)
            hist = stock.history(period=period, interval=interval)
            
            if hist.empty:
                raise ValueError(f"No history found for ticker {ticker}")

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
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Error fetching history for {ticker}: {str(e)}")

    @staticmethod
    def get_stock_info(ticker: str) -> Dict[str, Any]:
        """
        Fetches comprehensive company metadata and fundamentals.
        """
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            if not info or 'symbol' not in info and 'longName' not in info:
                raise ValueError(f"Invalid ticker or no info available for {ticker}")

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
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Error fetching info for {ticker}: {str(e)}")
