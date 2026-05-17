"""
AI Features Service — Core logic for all 10 advanced AI features.
Handles data gathering, pattern detection, and LLM orchestration.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from services.llm_service import llm_service
from services.ai_features_prompts import (
    build_market_narrator_prompt,
    build_candle_pattern_prompt,
    build_event_detection_prompt,
    build_daily_briefing_prompt,
    build_term_explainer_prompt,
    build_stock_comparison_prompt,
    build_backtest_story_prompt,
    build_entry_timing_prompt,
    build_scam_detector_prompt,
    build_post_trade_prompt,
)

logger = logging.getLogger("alphaai.ai_features")


# ── Candlestick Pattern Detection (free, pandas-based) ─────────────────────

def detect_candle_pattern(df: pd.DataFrame) -> str:
    """Detect common candlestick patterns from OHLCV data."""
    if df is None or len(df) < 3:
        return "unknown — analyze from the data"

    last = df.iloc[-1]
    prev = df.iloc[-2]
    body = abs(last["Close"] - last["Open"])
    total_range = last["High"] - last["Low"]

    if total_range == 0:
        return "Doji"

    body_ratio = body / total_range

    # Doji
    if body_ratio < 0.1:
        return "Doji"

    # Hammer
    lower_shadow = min(last["Open"], last["Close"]) - last["Low"]
    upper_shadow = last["High"] - max(last["Open"], last["Close"])
    if lower_shadow > body * 2 and upper_shadow < body * 0.5:
        return "Hammer"

    # Inverted Hammer
    if upper_shadow > body * 2 and lower_shadow < body * 0.5:
        return "Inverted Hammer"

    # Bullish Engulfing
    prev_body = abs(prev["Close"] - prev["Open"])
    if (prev["Close"] < prev["Open"] and
        last["Close"] > last["Open"] and
        last["Open"] <= prev["Close"] and
        last["Close"] >= prev["Open"]):
        return "Bullish Engulfing"

    # Bearish Engulfing
    if (prev["Close"] > prev["Open"] and
        last["Close"] < last["Open"] and
        last["Open"] >= prev["Close"] and
        last["Close"] <= prev["Open"]):
        return "Bearish Engulfing"

    # Shooting Star
    if (upper_shadow > body * 2 and
        lower_shadow < body * 0.3 and
        last["Close"] < last["Open"]):
        return "Shooting Star"

    # Morning Star (3-candle)
    if len(df) >= 3:
        two_back = df.iloc[-3]
        if (two_back["Close"] < two_back["Open"] and
            abs(prev["Close"] - prev["Open"]) / max(prev["High"] - prev["Low"], 0.01) < 0.3 and
            last["Close"] > last["Open"] and
            last["Close"] > (two_back["Open"] + two_back["Close"]) / 2):
            return "Morning Star"

    return "unknown — analyze from the data"


class AIFeaturesService:
    """Orchestrates all 10 AI features."""

    # ── 1. Market Narrator ──────────────────────────────────────────────

    async def get_market_narration(self, language: str = "en") -> Dict[str, Any]:
        """Generate spoken market briefing using real PSX data."""
        from services.stock_service import StockService

        try:
            psx = StockService.get_market_category("PSX")
        except Exception:
            psx = []

        kse100 = "unknown"
        kse_change = "unknown"
        top_gainer = "N/A"
        gainer_pct = "0"
        top_loser = "N/A"
        loser_pct = "0"

        if psx:
            sorted_by_change = sorted(psx, key=lambda x: x.get("change_percent", 0), reverse=True)
            if sorted_by_change:
                g = sorted_by_change[0]
                top_gainer = g.get("name", g.get("symbol", "N/A"))
                gainer_pct = str(round(g.get("change_percent", 0), 2))
            if len(sorted_by_change) > 1:
                l = sorted_by_change[-1]
                top_loser = l.get("name", l.get("symbol", "N/A"))
                loser_pct = str(abs(round(l.get("change_percent", 0), 2)))

        prompt = build_market_narrator_prompt(
            kse100=kse100, kse_change=kse_change,
            top_gainer=top_gainer, gainer_pct=gainer_pct,
            top_loser=top_loser, loser_pct=loser_pct,
            sentiment_label="NEUTRAL", fear_greed_value="50", fear_greed_label="Neutral",
            language=language,
        )
        text = await llm_service.complete(prompt, max_tokens=300)
        return {"narration": text, "language": language}

    # ── 2. Candle Pattern Explainer ─────────────────────────────────────

    async def explain_candle_pattern(self, ticker: str, timeframe: str = "1d", language: str = "en") -> Dict[str, Any]:
        """Detect and explain candlestick pattern for a ticker."""
        from services.stock_service import StockService

        history = StockService.get_stock_history(ticker, period="1mo", interval=timeframe)
        if not history or len(history) < 5:
            return {"pattern": "Insufficient data", "explanation": "Not enough candle data."}

        df = pd.DataFrame(history[-5:])
        pattern = detect_candle_pattern(df)
        ohlcv_json = json.dumps(history[-5:], indent=2)

        prompt = build_candle_pattern_prompt(
            ticker=ticker.upper(), timeframe=timeframe,
            ohlcv_json=ohlcv_json, pattern_name=pattern, language=language,
        )
        explanation = await llm_service.complete(prompt, max_tokens=300)
        return {"ticker": ticker.upper(), "pattern": pattern, "explanation": explanation, "candles": history[-5:]}

    # ── 3. Event Detection ──────────────────────────────────────────────

    async def detect_events(self, language: str = "en") -> List[Dict[str, Any]]:
        """Find stocks that moved >3% and generate explanations."""
        from services.stock_service import StockService, MARKET_TICKERS
        from services.news_service import NewsService

        news_svc = NewsService()
        events = []
        all_tickers = {}
        for cat in ("PSX", "US"):
            all_tickers.update(MARKET_TICKERS.get(cat, {}))

        for symbol in list(all_tickers.keys())[:15]:
            try:
                price_data = StockService.get_stock_price(symbol)
                change_pct = price_data.get("change_percent", 0)
                if abs(change_pct) >= 3:
                    headlines = []
                    try:
                        articles = news_svc.get_stock_news(symbol, max_articles=3, days_back=1)
                        headlines = [a.get("headline", "") for a in articles if a.get("headline")]
                    except Exception:
                        pass

                    direction = "up" if change_pct > 0 else "down"
                    prompt = build_event_detection_prompt(
                        ticker=symbol, price_change_pct=str(round(change_pct, 2)),
                        direction=direction, open_price=str(price_data.get("price", 0) - price_data.get("change", 0)),
                        close_price=str(price_data.get("price", 0)),
                        headlines_list="\n".join(headlines) if headlines else "No recent headlines found.",
                        rsi="50", rsi_signal="NEUTRAL", volume_ratio="1.0", macd_signal="NEUTRAL",
                        language=language,
                    )
                    explanation = await llm_service.complete(prompt, max_tokens=200)
                    events.append({
                        "ticker": symbol, "change_pct": round(change_pct, 2),
                        "direction": direction, "price": price_data.get("price", 0),
                        "explanation": explanation,
                    })
            except Exception as e:
                logger.warning("Event detection failed for %s: %s", symbol, e)

        return events

    # ── 4. Daily Briefing ───────────────────────────────────────────────

    async def generate_daily_briefing(
        self, watchlist: List[str], holdings_summary: str = "None",
        pnl_change: str = "0", language: str = "en",
    ) -> Dict[str, Any]:
        """Generate personalized morning briefing for a user."""
        from services.stock_service import StockService

        stock_lines = []
        for sym in watchlist[:8]:
            try:
                p = StockService.get_stock_price(sym)
                stock_lines.append(f"{sym}: price={p.get('price', 0)}, change={p.get('change_percent', 0)}%")
            except Exception:
                stock_lines.append(f"{sym}: data unavailable")

        prompt = build_daily_briefing_prompt(
            watchlist_symbols=", ".join(watchlist),
            holdings_summary=holdings_summary,
            date=datetime.now().strftime("%B %d, %Y"),
            minutes_until_open="varies",
            stock_data_lines="\n".join(stock_lines),
            pnl_change=pnl_change,
            most_important_event="Check news for latest updates",
            language=language,
        )
        briefing = await llm_service.complete(prompt, max_tokens=400)
        return {"briefing": briefing, "date": datetime.now().isoformat()}

    # ── 5. Term Explainer ───────────────────────────────────────────────

    async def explain_term(
        self, term: str, ticker: str = "AAPL",
        experience_level: str = "beginner",
        indicator_data: str = "No specific data available",
        language: str = "en",
    ) -> Dict[str, Any]:
        prompt = build_term_explainer_prompt(
            term=term, ticker=ticker, experience_level=experience_level,
            relevant_indicator_data=indicator_data, language=language,
        )
        explanation = await llm_service.complete(prompt, max_tokens=300)
        return {"term": term, "ticker": ticker, "explanation": explanation}

    # ── 6. Stock Comparison ─────────────────────────────────────────────

    async def compare_stocks(self, ticker_a: str, ticker_b: str, language: str = "en") -> Dict[str, Any]:
        from services.stock_service import StockService
        from services.technical_service import TechnicalService

        tech_svc = TechnicalService()
        data = {}
        for t in (ticker_a, ticker_b):
            try:
                price = StockService.get_stock_price(t)
                tech = tech_svc.get_all_indicators(t)
                data[t] = {"price": price, "tech": tech}
            except Exception:
                data[t] = {"price": {"price": 0}, "tech": {"rsi": {"value": 50, "signal": "NEUTRAL"}, "macd": {"signal": "NEUTRAL"}, "moving_averages": {"trend": "NEUTRAL"}}}

        da, db = data[ticker_a], data[ticker_b]
        prompt = build_stock_comparison_prompt(
            ticker_a=ticker_a.upper(),
            price_a=str(da["price"].get("price", 0)),
            rsi_a=str(da["tech"].get("rsi", {}).get("value", 50)),
            signal_a=da["tech"].get("rsi", {}).get("signal", "NEUTRAL"),
            sentiment_a="NEUTRAL", ma_trend_a=da["tech"].get("moving_averages", {}).get("trend", "NEUTRAL"),
            confidence_a="50",
            ticker_b=ticker_b.upper(),
            price_b=str(db["price"].get("price", 0)),
            rsi_b=str(db["tech"].get("rsi", {}).get("value", 50)),
            signal_b=db["tech"].get("rsi", {}).get("signal", "NEUTRAL"),
            sentiment_b="NEUTRAL", ma_trend_b=db["tech"].get("moving_averages", {}).get("trend", "NEUTRAL"),
            confidence_b="50",
            language=language,
        )
        comparison = await llm_service.complete(prompt, max_tokens=300)
        return {"ticker_a": ticker_a.upper(), "ticker_b": ticker_b.upper(), "comparison": comparison}

    # ── 7. Backtest Story ───────────────────────────────────────────────

    async def backtest_story(self, ticker: str, amount: float = 50000, months: int = 6, currency: str = "PKR", language: str = "en") -> Dict[str, Any]:
        from services.stock_service import StockService

        period = f"{months}mo" if months <= 12 else "1y"
        history = StockService.get_stock_history(ticker, period=period, interval="1d")
        if not history or len(history) < 10:
            return {"error": "Insufficient historical data"}

        start_price = history[0]["close"]
        current_price = history[-1]["close"]
        shares = amount / start_price if start_price > 0 else 0
        current_value = shares * current_price
        return_pct = ((current_price - start_price) / start_price * 100) if start_price > 0 else 0

        prompt = build_backtest_story_prompt(
            ticker=ticker.upper(), amount=str(round(amount)),
            currency=currency, start_date=history[0]["date"][:10],
            start_price=str(round(start_price, 2)),
            current_price=str(round(current_price, 2)),
            shares=str(round(shares, 2)),
            current_value=str(round(current_value, 2)),
            return_pct=str(round(return_pct, 2)),
            major_events_list="Market experienced typical fluctuations during this period.",
            language=language,
        )
        story = await llm_service.complete(prompt, max_tokens=350)
        return {
            "ticker": ticker.upper(), "story": story,
            "start_price": round(start_price, 2), "current_price": round(current_price, 2),
            "return_pct": round(return_pct, 2), "current_value": round(current_value, 2),
        }

    # ── 8. Entry Timing ─────────────────────────────────────────────────

    async def analyze_entry_timing(self, ticker: str, language: str = "en") -> Dict[str, Any]:
        from services.stock_service import StockService
        from services.technical_service import TechnicalService

        tech_svc = TechnicalService()
        price_data = StockService.get_stock_price(ticker)
        tech = tech_svc.get_all_indicators(ticker)
        info = StockService.get_stock_info(ticker)

        current_price = price_data.get("price", 0)
        sma20 = tech.get("moving_averages", {}).get("sma_20")
        high52 = info.get("fifty_two_week_high")
        low52 = info.get("fifty_two_week_low")

        sma_diff = round(((current_price - sma20) / sma20 * 100), 2) if sma20 and sma20 > 0 else 0
        vs_high = round(((current_price - high52) / high52 * 100), 2) if high52 and high52 > 0 else 0
        vs_low = round(((current_price - low52) / low52 * 100), 2) if low52 and low52 > 0 else 0

        prompt = build_entry_timing_prompt(
            ticker=ticker.upper(),
            rsi=str(tech.get("rsi", {}).get("value", 50)),
            price_vs_sma20="above" if sma_diff >= 0 else "below",
            sma_diff=str(abs(sma_diff)),
            vs_52w_high=str(abs(vs_high)),
            vs_52w_low=str(abs(vs_low)),
            volume_ratio="1.0", signal="HOLD", confidence="50",
            language=language,
        )
        analysis = await llm_service.complete(prompt, max_tokens=250)
        return {"ticker": ticker.upper(), "analysis": analysis, "current_price": current_price}

    # ── 9. Scam Detector ────────────────────────────────────────────────

    async def check_scam(self, tip_text: str, ticker: str, language: str = "en") -> Dict[str, Any]:
        from services.stock_service import StockService
        from services.technical_service import TechnicalService

        tech_svc = TechnicalService()
        try:
            price_data = StockService.get_stock_price(ticker)
            tech = tech_svc.get_all_indicators(ticker)
        except Exception:
            return {"error": f"Cannot verify — no data for {ticker}"}

        prompt = build_scam_detector_prompt(
            user_pasted_tip=tip_text, ticker=ticker.upper(),
            real_price=str(price_data.get("price", 0)),
            volume_ratio="1.0",
            rsi=str(tech.get("rsi", {}).get("value", 50)),
            price_change_7d=str(price_data.get("change_percent", 0)),
            sentiment_label="NEUTRAL", article_count="0",
            language=language,
        )
        verdict = await llm_service.complete(prompt, max_tokens=300)
        return {"ticker": ticker.upper(), "tip": tip_text, "verdict": verdict}

    # ── 10. Post-Trade Analyzer ─────────────────────────────────────────

    async def analyze_trade(
        self, ticker: str, buy_price: float, buy_date: str,
        sell_price: float, sell_date: str, language: str = "en",
    ) -> Dict[str, Any]:
        pnl = sell_price - buy_price
        pnl_pct = (pnl / buy_price * 100) if buy_price > 0 else 0
        days_held = 0
        try:
            d1 = datetime.strptime(buy_date, "%Y-%m-%d")
            d2 = datetime.strptime(sell_date, "%Y-%m-%d")
            days_held = (d2 - d1).days
        except Exception:
            pass

        prompt = build_post_trade_prompt(
            ticker=ticker.upper(), buy_price=str(buy_price), buy_date=buy_date,
            sell_price=str(sell_price), sell_date=sell_date,
            profit_loss=str(round(pnl, 2)), pnl_pct=str(round(pnl_pct, 2)),
            days_held=str(days_held),
            rsi_at_buy="50", signal_at_buy="HOLD", sentiment_at_buy="NEUTRAL",
            rsi_at_sell="50", signal_at_sell="HOLD", sentiment_at_sell="NEUTRAL",
            language=language,
        )
        review = await llm_service.complete(prompt, max_tokens=350)
        return {
            "ticker": ticker.upper(), "review": review,
            "pnl": round(pnl, 2), "pnl_pct": round(pnl_pct, 2), "days_held": days_held,
        }


ai_features_service = AIFeaturesService()
