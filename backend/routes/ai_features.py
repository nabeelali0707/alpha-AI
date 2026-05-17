"""
AI Features Routes — All 10 advanced AI-powered endpoints.
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.ai_features_service import ai_features_service

router = APIRouter()
logger = logging.getLogger("alphaai.routes.ai_features")


# ── Request Models ──────────────────────────────────────────────────────────

class NarratorRequest(BaseModel):
    language: str = "en"


class CandlePatternRequest(BaseModel):
    ticker: str
    timeframe: str = "1d"
    language: str = "en"


class EventDetectionRequest(BaseModel):
    language: str = "en"


class DailyBriefingRequest(BaseModel):
    watchlist: List[str] = Field(default_factory=lambda: ["AAPL", "MSFT", "NVDA"])
    holdings_summary: str = "None"
    pnl_change: str = "0"
    language: str = "en"


class TermExplainerRequest(BaseModel):
    term: str
    ticker: str = "AAPL"
    experience_level: str = "beginner"
    indicator_data: str = ""
    language: str = "en"


class CompareRequest(BaseModel):
    ticker_a: str
    ticker_b: str
    language: str = "en"


class BacktestRequest(BaseModel):
    ticker: str
    amount: float = 50000
    months: int = 6
    currency: str = "PKR"
    language: str = "en"


class EntryTimingRequest(BaseModel):
    ticker: str
    language: str = "en"


class ScamCheckRequest(BaseModel):
    tip_text: str
    ticker: str
    language: str = "en"


class TradeAnalysisRequest(BaseModel):
    ticker: str
    buy_price: float
    buy_date: str
    sell_price: float
    sell_date: str
    language: str = "en"


# ── Routes ──────────────────────────────────────────────────────────────────

@router.post("/narrator", summary="Market Mood Voice Narrator")
async def market_narrator(payload: NarratorRequest):
    """Generate a spoken market briefing for text-to-speech."""
    return await ai_features_service.get_market_narration(language=payload.language)


@router.post("/candle-pattern", summary="Explain Candle Pattern")
async def candle_pattern(payload: CandlePatternRequest):
    """Detect and explain candlestick patterns."""
    return await ai_features_service.explain_candle_pattern(
        ticker=payload.ticker, timeframe=payload.timeframe, language=payload.language,
    )


@router.get("/events", summary="What Just Happened — Event Detection")
async def event_detection(language: str = "en"):
    """Auto-detect stocks that moved >3% and explain why."""
    return await ai_features_service.detect_events(language=language)


@router.post("/daily-briefing", summary="Personalized Daily Briefing")
async def daily_briefing(payload: DailyBriefingRequest):
    """Generate a personalized morning stock briefing."""
    return await ai_features_service.generate_daily_briefing(
        watchlist=payload.watchlist, holdings_summary=payload.holdings_summary,
        pnl_change=payload.pnl_change, language=payload.language,
    )


@router.post("/explain-term", summary="Teach Me This Term")
async def explain_term(payload: TermExplainerRequest):
    """Explain a financial term in simple language."""
    return await ai_features_service.explain_term(
        term=payload.term, ticker=payload.ticker,
        experience_level=payload.experience_level,
        indicator_data=payload.indicator_data, language=payload.language,
    )


@router.post("/compare", summary="AI Stock Comparison")
async def compare_stocks(payload: CompareRequest):
    """Compare two stocks head-to-head and declare a winner."""
    return await ai_features_service.compare_stocks(
        ticker_a=payload.ticker_a, ticker_b=payload.ticker_b, language=payload.language,
    )


@router.post("/backtest", summary="Backtesting Story")
async def backtest_story(payload: BacktestRequest):
    """What if I bought this stock X months ago?"""
    return await ai_features_service.backtest_story(
        ticker=payload.ticker, amount=payload.amount,
        months=payload.months, currency=payload.currency, language=payload.language,
    )


@router.post("/entry-timing", summary="Entry Timing Analyzer")
async def entry_timing(payload: EntryTimingRequest):
    """Is now a good time to buy this stock?"""
    return await ai_features_service.analyze_entry_timing(
        ticker=payload.ticker, language=payload.language,
    )


@router.post("/scam-check", summary="Scam/Pump Detector")
async def scam_check(payload: ScamCheckRequest):
    """Verify a stock tip against real data."""
    return await ai_features_service.check_scam(
        tip_text=payload.tip_text, ticker=payload.ticker, language=payload.language,
    )


@router.post("/trade-review", summary="Post-Trade Analyzer")
async def trade_review(payload: TradeAnalysisRequest):
    """Analyze a completed trade — coaching review."""
    return await ai_features_service.analyze_trade(
        ticker=payload.ticker, buy_price=payload.buy_price, buy_date=payload.buy_date,
        sell_price=payload.sell_price, sell_date=payload.sell_date, language=payload.language,
    )
