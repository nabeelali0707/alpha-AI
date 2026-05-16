"""
Technical Analysis Service — Step 10
Calculates RSI, Moving Averages, MACD, and Volatility using pandas/numpy.
"""

import logging
from functools import lru_cache
from typing import Any, Dict

import numpy as np
import pandas as pd
from fastapi import HTTPException

logger = logging.getLogger(__name__)


@lru_cache(maxsize=64)
def _cached_history(ticker: str, period: str, interval: str) -> pd.DataFrame:
    """Cache historical price frames for repeated technical analysis requests."""
    try:
        import yfinance as yf
    except Exception as e:
        raise ValueError(f"yfinance is not available: {e}")

    stock = yf.Ticker(ticker)
    df = stock.history(period=period, interval=interval)
    if df.empty:
        raise ValueError(f"No historical data found for {ticker}")
    return df


class TechnicalService:
    """Provides technical indicator calculations for stock analysis."""

    @staticmethod
    def _fetch_dataframe(ticker: str, period: str = "6mo", interval: str = "1d") -> pd.DataFrame:
        """Fetch historical data as a pandas DataFrame."""
        try:
            return _cached_history(ticker.upper(), period, interval)
        except Exception as e:
            # Try shorter periods as a fallback before failing
            for fallback_period in ("6mo", "3mo", "1mo", "5d"):
                try:
                    return _cached_history(ticker.upper(), fallback_period, interval)
                except Exception:
                    continue
            raise HTTPException(status_code=404, detail=f"Cannot fetch data for {ticker}: {e}")

    @staticmethod
    def calculate_rsi(df: pd.DataFrame, period: int = 14) -> Dict[str, Any]:
        """
        Calculate the Relative Strength Index (RSI).
        RSI > 70 = overbought, RSI < 30 = oversold.
        """
        close = df["Close"]
        delta = close.diff()

        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)

        avg_gain = gain.rolling(window=period, min_periods=period).mean()
        avg_loss = loss.rolling(window=period, min_periods=period).mean()

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))

        current_rsi = float(rsi.iloc[-1]) if not pd.isna(rsi.iloc[-1]) else 50.0

        if current_rsi > 70:
            signal = "OVERBOUGHT"
        elif current_rsi < 30:
            signal = "OVERSOLD"
        else:
            signal = "NEUTRAL"

        return {
            "value": round(current_rsi, 2),
            "period": period,
            "signal": signal,
        }

    @staticmethod
    def calculate_moving_averages(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate SMA-20, SMA-50, SMA-200 and EMA-12, EMA-26.
        """
        close = df["Close"]
        current_price = float(close.iloc[-1])

        sma_20 = float(close.rolling(window=20).mean().iloc[-1]) if len(close) >= 20 else None
        sma_50 = float(close.rolling(window=50).mean().iloc[-1]) if len(close) >= 50 else None
        sma_200 = float(close.rolling(window=200).mean().iloc[-1]) if len(close) >= 200 else None
        ema_12 = float(close.ewm(span=12, adjust=False).mean().iloc[-1])
        ema_26 = float(close.ewm(span=26, adjust=False).mean().iloc[-1])

        # Determine trend
        if sma_50 and sma_200:
            if sma_50 > sma_200:
                trend = "GOLDEN_CROSS"  # Bullish
            elif sma_50 < sma_200:
                trend = "DEATH_CROSS"  # Bearish
            else:
                trend = "NEUTRAL"
        elif sma_20:
            trend = "BULLISH" if current_price > sma_20 else "BEARISH"
        else:
            trend = "INSUFFICIENT_DATA"

        return {
            "sma_20": round(sma_20, 2) if sma_20 else None,
            "sma_50": round(sma_50, 2) if sma_50 else None,
            "sma_200": round(sma_200, 2) if sma_200 else None,
            "ema_12": round(ema_12, 2),
            "ema_26": round(ema_26, 2),
            "current_price": round(current_price, 2),
            "trend": trend,
        }

    @staticmethod
    def calculate_macd(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate MACD (Moving Average Convergence Divergence).
        MACD Line = EMA-12 − EMA-26
        Signal Line = EMA-9 of MACD Line
        Histogram = MACD Line − Signal Line
        """
        close = df["Close"]

        ema_12 = close.ewm(span=12, adjust=False).mean()
        ema_26 = close.ewm(span=26, adjust=False).mean()
        macd_line = ema_12 - ema_26
        signal_line = macd_line.ewm(span=9, adjust=False).mean()
        histogram = macd_line - signal_line

        current_macd = float(macd_line.iloc[-1])
        current_signal = float(signal_line.iloc[-1])
        current_histogram = float(histogram.iloc[-1])

        if current_macd > current_signal:
            signal = "BULLISH"
        elif current_macd < current_signal:
            signal = "BEARISH"
        else:
            signal = "NEUTRAL"

        return {
            "macd_line": round(current_macd, 4),
            "signal_line": round(current_signal, 4),
            "histogram": round(current_histogram, 4),
            "signal": signal,
        }

    @staticmethod
    def calculate_volatility(df: pd.DataFrame, window: int = 20) -> Dict[str, Any]:
        """
        Calculate annualized historical volatility using log returns.
        """
        close = df["Close"]
        log_returns = np.log(close / close.shift(1)).dropna()

        daily_vol = float(log_returns.rolling(window=window).std().iloc[-1])
        annualized_vol = daily_vol * np.sqrt(252)

        if annualized_vol > 0.4:
            risk_level = "HIGH"
        elif annualized_vol > 0.2:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        return {
            "daily_volatility": round(daily_vol, 4),
            "annualized_volatility": round(annualized_vol, 4),
            "risk_level": risk_level,
            "window": window,
        }

    @staticmethod
    def calculate_bollinger_bands(df: pd.DataFrame, window: int = 20, num_std: float = 2.0) -> Dict[str, Any]:
        """
        Calculate Bollinger Bands.
        Upper Band = SMA-20 + 2 * StdDev
        Lower Band = SMA-20 - 2 * StdDev
        """
        close = df["Close"]
        sma = close.rolling(window=window).mean()
        std = close.rolling(window=window).std()

        upper_band = sma + num_std * std
        lower_band = sma - num_std * std
        current_price = float(close.iloc[-1])
        current_sma = float(sma.iloc[-1]) if not pd.isna(sma.iloc[-1]) else None
        current_upper = float(upper_band.iloc[-1]) if not pd.isna(upper_band.iloc[-1]) else None
        current_lower = float(lower_band.iloc[-1]) if not pd.isna(lower_band.iloc[-1]) else None

        # Bandwidth: (upper - lower) / middle
        bandwidth = None
        if current_upper and current_lower and current_sma:
            bandwidth = round((current_upper - current_lower) / current_sma, 4)

        # %B: (price - lower) / (upper - lower)
        percent_b = None
        if current_upper and current_lower and current_upper != current_lower:
            percent_b = round((current_price - current_lower) / (current_upper - current_lower), 4)

        # Signal
        if current_upper and current_price >= current_upper:
            signal = "OVERBOUGHT"
        elif current_lower and current_price <= current_lower:
            signal = "OVERSOLD"
        else:
            signal = "NEUTRAL"

        return {
            "upper_band": round(current_upper, 2) if current_upper else None,
            "middle_band": round(current_sma, 2) if current_sma else None,
            "lower_band": round(current_lower, 2) if current_lower else None,
            "bandwidth": bandwidth,
            "percent_b": percent_b,
            "signal": signal,
            "window": window,
        }

    def get_all_indicators(self, ticker: str) -> Dict[str, Any]:
        """
        Calculate all technical indicators for a given ticker.
        Returns a JSON-ready dict.
        """
        try:
            df = self._fetch_dataframe(ticker, period="1y", interval="1d")
        except HTTPException:
            # Return empty indicators instead of failing the whole dashboard
            return {
                "symbol": ticker.upper(),
                "rsi": {"value": 50.0, "period": 14, "signal": "NEUTRAL"},
                "moving_averages": {
                    "sma_20": None,
                    "sma_50": None,
                    "sma_200": None,
                    "ema_12": None,
                    "ema_26": None,
                    "current_price": None,
                    "trend": "INSUFFICIENT_DATA",
                },
                "macd": {"macd_line": 0.0, "signal_line": 0.0, "histogram": 0.0, "signal": "NEUTRAL"},
                "volatility": {"daily_volatility": 0.0, "annualized_volatility": 0.0, "risk_level": "MODERATE", "window": 20},
            }

        return {
            "symbol": ticker.upper(),
            "rsi": self.calculate_rsi(df),
            "moving_averages": self.calculate_moving_averages(df),
            "macd": self.calculate_macd(df),
            "volatility": self.calculate_volatility(df),
            "bollinger_bands": self.calculate_bollinger_bands(df),
        }
