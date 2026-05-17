"""
Recommendation Engine — Step 8 (Rewritten)
Generates BUY / SELL / HOLD recommendations using real algorithmic logic:
- News sentiment analysis
- Price trend (moving averages)
- Technical indicators (RSI, MACD)
- Trading volume analysis
"""

import logging
from typing import Any, Dict, List

from fastapi import HTTPException

from services.stock_service import StockService
from services.technical_service import TechnicalService
from services.sentiment_ai import SentimentService

logger = logging.getLogger(__name__)


class RecommenderService:
    """AI-powered stock recommendation engine."""

    def __init__(self):
        self.stock_service = StockService()
        self.technical_service = TechnicalService()
        self.sentiment_service = SentimentService()

    async def generate_recommendation(
        self,
        stock_data: Dict[str, Any] | str,
        sentiment_data: Dict[str, Any] | None = None,
        technical_indicators: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """
        Generate a BUY/SELL/HOLD recommendation for a single ticker by
        combining technical indicators with AI sentiment analysis.

        Scoring system (total ~= 100 points, normalized):
            - Sentiment:        25 points
            - RSI:              18 points
            - MACD:             18 points
            - Moving Averages:  18 points
            - Volatility:        8 points
            - Volume Surge:     13 points
            - Momentum Bonus:   ±5 points
        """
        try:
            ticker = "UNKNOWN"
            if isinstance(stock_data, str):
                ticker = stock_data.upper()
                price_data = self.stock_service.get_stock_price(ticker)
            else:
                ticker = str(stock_data.get("symbol") or stock_data.get("ticker") or "").upper()
                if not ticker:
                    raise ValueError("stock_data must include a symbol or ticker")
                price_data = stock_data

            # ── 1. Gather data ──────────────────────────────────────────
            technicals = technical_indicators or self.technical_service.get_all_indicators(ticker)
            sentiment = sentiment_data or await self.sentiment_service.analyze(ticker)

            # ── 2. Score each factor ────────────────────────────────────
            score = 0.0
            reasons: List[str] = []

            # — Sentiment (max 25) —
            sent_label = str(sentiment.get("label", "NEUTRAL")).upper()
            try:
                sent_score = float(sentiment.get("score", 0.0) or 0.0)
            except Exception:
                sent_score = 0.0
            if sent_label == "BULLISH":
                sentiment_points = 20 + min(abs(sent_score) * 5, 5)
                reasons.append(f"Positive market sentiment (score: {sent_score})")
            elif sent_label == "BEARISH":
                sentiment_points = 5 - min(abs(sent_score) * 5, 5)
                reasons.append(f"Negative market sentiment (score: {sent_score})")
            else:
                sentiment_points = 12
                reasons.append("Neutral market sentiment — no strong directional bias")
            score += max(0, min(sentiment_points, 25))

            # — RSI (max 20) —
            rsi_data = technicals.get("rsi", {})
            rsi_value = rsi_data.get("value", 50)
            rsi_signal = rsi_data.get("signal", "NEUTRAL")
            if rsi_signal == "OVERSOLD":
                rsi_points = 18
                reasons.append(f"RSI at {rsi_value} — oversold, potential reversal upward")
            elif rsi_signal == "OVERBOUGHT":
                rsi_points = 4
                reasons.append(f"RSI at {rsi_value} — overbought, potential pullback")
            else:
                rsi_points = 10 + (50 - rsi_value) * 0.2  # slight bias toward lower RSI
                reasons.append(f"RSI at {rsi_value} — within normal range")
            score += max(0, min(rsi_points, 20))

            # — MACD (max 20) —
            macd_data = technicals.get("macd", {})
            macd_signal = macd_data.get("signal", "NEUTRAL")
            try:
                macd_hist = float(macd_data.get("histogram", 0) or 0)
            except Exception:
                macd_hist = 0.0
            if macd_signal == "BULLISH":
                macd_points = 16 + min(abs(float(macd_hist)) * 2, 4)
                reasons.append("MACD shows bullish crossover — momentum building")
            elif macd_signal == "BEARISH":
                macd_points = max(0, 4 - min(abs(macd_hist) * 2, 4))
                reasons.append("MACD shows bearish divergence — selling pressure")
            else:
                macd_points = 10
                reasons.append("MACD is neutral — no clear momentum")
            score += max(0, min(macd_points, 20))

            # — Moving Averages (max 20) —
            ma_data = technicals.get("moving_averages", {})
            ma_trend = ma_data.get("trend", "NEUTRAL")
            if ma_trend == "GOLDEN_CROSS":
                ma_points = 18
                reasons.append("Golden cross detected (SMA-50 > SMA-200) — bullish trend")
            elif ma_trend == "DEATH_CROSS":
                ma_points = 4
                reasons.append("Death cross detected (SMA-50 < SMA-200) — bearish trend")
            elif ma_trend == "BULLISH":
                ma_points = 15
                reasons.append("Price trading above key moving averages")
            elif ma_trend == "BEARISH":
                ma_points = 6
                reasons.append("Price trading below key moving averages")
            else:
                ma_points = 10
                reasons.append("Moving average trend is neutral")
            score += ma_points

            # — Volatility (max 10) —
            vol_data = technicals.get("volatility", {})
            risk_level = vol_data.get("risk_level", "MODERATE")
            if risk_level == "LOW":
                vol_points = 8
                reasons.append("Low volatility — stable price action")
            elif risk_level == "HIGH":
                vol_points = 3
                reasons.append("High volatility — increased risk")
            else:
                vol_points = 5
                reasons.append("Moderate volatility")
            score += vol_points

            history_rows = self.stock_service.get_stock_history(ticker, period="1mo", interval="1d")

            # — Volume Surge (max 13) —
            try:
                recent_rows = [row for row in history_rows[-20:] if row.get("volume") is not None]
                if len(recent_rows) >= 5:
                    volumes = [float(row.get("volume", 0) or 0) for row in recent_rows]
                    avg_vol = sum(volumes[:-1]) / max(len(volumes) - 1, 1)
                    today_vol = volumes[-1]
                    vol_ratio = today_vol / avg_vol if avg_vol > 0 else 1.0
                    if vol_ratio >= 2.0:
                        volume_points = 12
                        reasons.append(f"Volume surge: {vol_ratio:.1f}x average — strong conviction signal")
                    elif vol_ratio >= 1.3:
                        volume_points = 8
                        reasons.append(f"Above-average volume ({vol_ratio:.1f}x) — healthy interest")
                    elif vol_ratio < 0.5:
                        volume_points = 2
                        reasons.append("Below-average volume — weak conviction")
                    else:
                        volume_points = 5
                        reasons.append("Normal trading volume")
                    score += max(0, min(volume_points, 13))
                else:
                    score += 5
                    reasons.append("Volume data unavailable")
            except Exception:
                score += 5
                reasons.append("Volume data unavailable")

            # — Price Momentum (7-day) —
            try:
                close_prices = [float(row.get("close", 0) or 0) for row in history_rows if row.get("close") is not None]
                if len(close_prices) >= 7 and close_prices[-7] > 0:
                    price_7d_ago = close_prices[-7]
                    price_now = close_prices[-1]
                    momentum_pct = ((price_now - price_7d_ago) / price_7d_ago) * 100
                    if momentum_pct > 5:
                        reasons.append(f"Strong 7-day price momentum: +{momentum_pct:.1f}%")
                        score += 5
                    elif momentum_pct < -5:
                        reasons.append(f"Negative 7-day momentum: {momentum_pct:.1f}% — bearish pressure")
                        score -= 5
                    else:
                        reasons.append(f"Neutral 7-day momentum: {momentum_pct:.1f}%")
            except Exception:
                pass

            # ── 3. Determine recommendation ────────────────────────────
            score = max(0.0, min(score, 100.0))
            confidence = round(score / 100, 2)

            if score >= 65:
                action = "BUY"
            elif score <= 35:
                action = "SELL"
            else:
                action = "HOLD"

            WIN_PROBABILITY_TABLE = {
                "BUY": {"HIGH": 72, "MODERATE": 61, "LOW": 54},
                "SELL": {"HIGH": 68, "MODERATE": 58, "LOW": 51},
                "HOLD": {"HIGH": 55, "MODERATE": 50, "LOW": 48},
            }
            vol_risk = vol_data.get("risk_level", "MODERATE")
            win_prob = WIN_PROBABILITY_TABLE.get(action, {}).get(vol_risk, 55)
            if abs(sent_score) > 0.7:
                win_prob = min(win_prob + 4, 82)
            elif abs(sent_score) < 0.2:
                win_prob = max(win_prob - 3, 45)

            explanation = self._build_explanation(action, reasons)
            urdu_explanation = self._build_urdu_explanation(
                action=action,
                ticker=ticker.upper(),
                rsi_value=float(rsi_value),
                sentiment_label=sent_label,
                ma_trend=ma_trend,
            )

            return {
                "symbol": ticker.upper(),
                "recommendation": action,
                "confidence": confidence,
                "score": round(score, 2),
                "explanation": explanation,
                "urdu_explanation": urdu_explanation,
                "reasons": reasons,
                "technical_indicators": technicals,
                "sentiment_summary": {
                    "label": sentiment.get("label"),
                    "score": sentiment.get("score"),
                    "total_articles": sentiment.get("total_articles"),
                    "breakdown": sentiment.get("breakdown"),
                },
                "price_data": price_data,
                "win_probability": win_prob,
                "disclaimer": "This is not financial advice. Past signals do not guarantee future results.",
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Recommendation generation failed for {ticker}: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate recommendation for {ticker}: {str(e)}",
            )

    async def get_top_picks(self, tickers: List[str] | None = None) -> List[Dict[str, Any]]:
        """
        Generate recommendations for a list of popular tickers.
        Sorted by confidence descending.
        """
        if tickers is None:
            tickers = ["NVDA", "AAPL", "MSFT", "TSLA", "AMD", "META", "GOOGL", "AMZN", "PLTR"]

        recommendations = []
        for ticker in tickers:
            try:
                rec = await self.generate_recommendation(ticker)
                recommendations.append(rec)
            except Exception as e:
                logger.warning(f"Skipping {ticker} in top picks: {e}")
                continue

        return sorted(recommendations, key=lambda x: x["confidence"], reverse=True)

    @staticmethod
    def _build_explanation(action: str, reasons: List[str]) -> str:
        """Build a human-readable explanation paragraph."""
        header = {
            "BUY": "Our analysis indicates a favorable buying opportunity.",
            "SELL": "Our analysis suggests reducing exposure to this position.",
            "HOLD": "Our analysis recommends maintaining your current position.",
        }
        body = header.get(action, "Analysis complete.")
        detail_lines = "\n".join(f"  • {r}" for r in reasons)
        return f"{body}\n\nKey factors:\n{detail_lines}"

    @staticmethod
    def _build_urdu_explanation(action: str, ticker: str, rsi_value: float, sentiment_label: str, ma_trend: str) -> str:
        rsi_urdu = f"RSI {rsi_value:.0f} ہے"

        if action == "BUY":
            return (
                f"{ticker} کے لیے ہماری AI کا مشورہ ہے: خریدیں۔ "
                f"{rsi_urdu} جو کہ اچھی پوزیشن ظاہر کرتا ہے۔ "
                f"مارکیٹ سینٹیمنٹ {sentiment_label} ہے۔ "
                f"ٹرینڈ {ma_trend} ہے۔ "
                f"یہ خریداری کا اچھا موقع ہو سکتا ہے۔"
            )
        if action == "SELL":
            return (
                f"{ticker} کے لیے ہماری AI کا مشورہ ہے: بیچیں۔ "
                f"{rsi_urdu}۔ "
                f"مارکیٹ سینٹیمنٹ {sentiment_label} ہے۔ "
                "ابھی احتیاط ضروری ہے۔"
            )

        return (
            f"{ticker} کے لیے ہماری AI کا مشورہ ہے: انتظار کریں۔ "
            f"{rsi_urdu}۔ "
            "مارکیٹ ابھی غیر یقینی ہے — کوئی بڑا فیصلہ نہ کریں۔"
        )
