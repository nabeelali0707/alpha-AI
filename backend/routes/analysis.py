"""
Analysis & Sentiment Routes — Steps 7, 9, 11 (Enhanced)
Endpoints:
    GET /sentiment/{symbol}   — AI sentiment analysis
    GET /recommend/{symbol}   — AI recommendation for a specific ticker
    GET /recommendations      — Top AI recommendations (multiple tickers)
    GET /dashboard/{symbol}   — Combined dashboard summary
    GET /technical/{symbol}   — Technical indicators
    GET /news/{symbol}        — Latest news articles
"""

import asyncio
import json
import logging
from typing import List, Optional

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field

from models.stock import (
    SentimentResult,
    Recommendation,
    TechnicalIndicators,
    DashboardResponse,
    ErrorResponse,
    NewsArticle,
)
from services.sentiment_ai import SentimentService
from services.recommender import RecommenderService
from services.technical_service import TechnicalService
from services.news_service import NewsService
from services.stock_service import StockService
from services.urdu_service import UrduService
from services.llm_service import llm_service
from services.llm_prompts import (
    build_stock_chat_prompt,
    build_portfolio_advisor_prompt,
    build_news_summary_prompt,
    build_urdu_explanation_prompt,
    build_sector_heatmap_prompt,
    build_earnings_prompt,
    build_pakistan_macro_prompt,
    build_risk_analyzer_prompt,
)
from utils.cache import cache_get, cache_set
from utils.limiter import limiter

router = APIRouter()
sentiment_service = SentimentService()
recommender_service = RecommenderService()
technical_service = TechnicalService()
news_service = NewsService()
stock_service = StockService()

logger = logging.getLogger("alphaai.routes.analysis")


class ChatRequest(BaseModel):
    ticker: str
    question: str
    price: str = "unknown"
    rsi: str = "unknown"
    rsi_signal: str = "NEUTRAL"
    macd_signal: str = "NEUTRAL"
    ma_trend: str = "NEUTRAL"
    sentiment_label: str = "NEUTRAL"
    sentiment_score: str = "0"
    total_articles: str = "0"
    recommendation: str = "HOLD"
    confidence: str = "0"
    reasons: List[str] = Field(default_factory=list)
    language: str = "en"


class PortfolioAdvisorRequest(BaseModel):
    holdings_json: str
    total_value: str
    total_pnl: str
    pnl_percent: str
    top_sector: str
    question: str
    language: str = "en"


class NewsSummaryRequest(BaseModel):
    ticker: str
    headlines: List[str]


class UrduExplanationRequest(BaseModel):
    ticker: str
    signal: str
    confidence: str
    rsi_value: str
    rsi_signal: str
    sentiment_label: str
    ma_trend: str
    top_reason: str


class SectorHeatmapRequest(BaseModel):
    sector: str
    stock_sentiment_list: str


class EarningsRequest(BaseModel):
    ticker: str
    days_until: str
    beat_1: str = "unknown"
    move_1: str = "unknown"
    beat_miss_2: str = "beat/miss"
    beat_2: str = "unknown"
    move_2: str = "unknown"
    beat_miss_3: str = "beat/miss"
    beat_3: str = "unknown"
    move_3: str = "unknown"
    beat_miss_4: str = "beat/miss"
    beat_4: str = "unknown"
    move_4: str = "unknown"
    sentiment_label: str = "NEUTRAL"
    recommendation: str = "HOLD"


class MacroRequest(BaseModel):
    ticker: str
    sector: str
    sbp_rate: str
    usd_pkr: str
    inflation: str
    kse100: str
    kse_change: str
    language: str = "en"


class RiskAnalyzerRequest(BaseModel):
    holdings_json: str
    max_weight: str
    max_stock: str
    top_sector: str
    sector_weight: str
    most_volatile: str
    beta: str
    pnl: str
    language: str = "en"


# ── Sentiment ───────────────────────────────────────────────────────────────

@router.get(
    "/sentiment/{symbol}",
    response_model=SentimentResult,
    summary="Analyze market sentiment",
    description=(
        "Fetches latest news for the ticker and runs FinBERT AI sentiment "
        "analysis on each headline. Returns per-headline scores and an "
        "overall BULLISH/BEARISH/NEUTRAL label."
    ),
    responses={
        200: {"description": "Sentiment analysis completed"},
        500: {"model": ErrorResponse, "description": "Analysis failed"},
    },
)
async def analyze_sentiment(symbol: str):
    """Analyze market sentiment for a specific ticker using FinBERT AI."""
    return await sentiment_service.analyze(symbol)


# ── Recommendation (single ticker) ─────────────────────────────────────────

@router.get(
    "/recommend/{symbol}",
    response_model=Recommendation,
    summary="Get AI recommendation for a stock",
    description=(
        "Generates a BUY/SELL/HOLD recommendation by combining news sentiment, "
        "RSI, MACD, moving averages, and volatility analysis. Returns a "
        "confidence score, AI explanation, technical indicators, and sentiment summary."
    ),
    responses={
        200: {"description": "Recommendation generated successfully"},
        404: {"model": ErrorResponse, "description": "Ticker not found"},
        500: {"model": ErrorResponse, "description": "Recommendation failed"},
    },
)
async def get_recommendation(symbol: str):
    """Get an AI-powered BUY/SELL/HOLD recommendation for a specific stock."""
    cache_key = f"rec:{symbol.upper()}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    rec = await recommender_service.generate_recommendation(symbol.upper())
    cache_set(cache_key, rec, ttl=180)
    return rec


# ── Recommendations (multiple tickers) ─────────────────────────────────────

@router.get(
    "/recommendations",
    response_model=list[Recommendation],
    summary="Get top AI stock picks",
    description="Generate AI recommendations for the top monitored tickers.",
    responses={
        200: {"description": "Recommendations generated"},
    },
)
async def get_recommendations():
    """Get AI-generated stock recommendations for popular tickers."""
    return await recommender_service.get_top_picks()


# ── Technical Indicators ───────────────────────────────────────────────────

@router.get(
    "/technical/{symbol}",
    response_model=TechnicalIndicators,
    summary="Get technical indicators",
    description="Calculate RSI, MACD, Moving Averages (SMA/EMA), and Volatility for a ticker.",
    responses={
        200: {"description": "Technical indicators calculated"},
        404: {"model": ErrorResponse, "description": "Ticker not found"},
    },
)
async def get_technical_indicators(symbol: str):
    """Get RSI, MACD, Moving Averages, and Volatility for a stock."""
    return technical_service.get_all_indicators(symbol)


# ── News ───────────────────────────────────────────────────────────────────

@router.get(
    "/news/{symbol}",
    response_model=list[NewsArticle],
    summary="Get latest stock news",
    description="Fetch the latest financial news articles for a stock ticker.",
    responses={
        200: {"description": "News articles fetched"},
    },
)
async def get_stock_news(symbol: str):
    """Fetch the latest financial news for a ticker."""
    return news_service.get_stock_news(symbol)


# ── Dashboard (combined) ───────────────────────────────────────────────────

@router.get(
    "/dashboard/{symbol}",
    response_model=DashboardResponse,
    summary="Get full dashboard summary",
    description=(
        "Returns a single JSON object combining stock price, history, metadata, "
        "AI sentiment analysis, recommendation, and technical indicators. "
        "Optimized for React frontend dashboards."
    ),
    responses={
        200: {"description": "Dashboard data assembled"},
        404: {"model": ErrorResponse, "description": "Ticker not found"},
    },
)
@limiter.limit("10/minute")
async def get_dashboard(request: Request, symbol: str):
    """
    Assemble a complete dashboard view for a single ticker.
    Combines all available data into one frontend-ready response.
    """
    try:
        price = await asyncio.to_thread(stock_service.get_stock_price, symbol)
    except Exception as exc:
        logger.warning("Price fetch failed for %s: %s", symbol, exc)
        price = None

    try:
        history = await asyncio.to_thread(stock_service.get_stock_history, symbol, "1mo")
    except Exception as exc:
        logger.warning("History fetch failed for %s: %s", symbol, exc)
        history = []

    try:
        metadata = await asyncio.to_thread(stock_service.get_stock_info, symbol)
    except Exception as exc:
        logger.warning("Metadata fetch failed for %s: %s", symbol, exc)
        metadata = None

    try:
        technicals = await asyncio.to_thread(technical_service.get_all_indicators, symbol)
    except Exception as exc:
        logger.warning("Technical indicators failed for %s: %s", symbol, exc)
        technicals = None

    # Continue with sentiment and recommendation; these may also fail — handle with try/except
    try:
        sentiment = await sentiment_service.analyze(symbol)
    except Exception:
        sentiment = None

    try:
        if price is not None and technicals is not None:
            recommendation = await recommender_service.generate_recommendation(
                price,
                sentiment_data=sentiment,
                technical_indicators=technicals,
            )
        else:
            recommendation = None
    except Exception:
        recommendation = None

    return {
        "symbol": symbol.upper(),
        "price": price,
        "history": history,
        "metadata": metadata,
        "sentiment": sentiment,
        "recommendation": recommendation,
        "technical_indicators": technicals,
    }


# ── Urdu Translation & Localization ────────────────────────────────────────

@router.get(
    "/urdu/translate",
    summary="Translate financial term to Urdu",
    description="Translate English financial terms to Urdu for Pakistani investors.",
)
async def translate_to_urdu(term: str):
    """Translate a financial term to Urdu"""
    urdu_term = UrduService.translate_term(term)
    return {"term": term, "urdu_translation": urdu_term}


@router.get(
    "/urdu/recommend/{symbol}",
    summary="Get Urdu recommendation",
    description="Get AI recommendation with Urdu explanation for Pakistani users",
)
async def get_urdu_recommendation(symbol: str):
    """Get recommendation with Urdu explanation"""
    try:
        recommendation = await recommender_service.generate_recommendation(symbol)
        urdu_explanation = UrduService.translate_recommendation(recommendation)
        
        return {
            "symbol": symbol.upper(),
            "signal": recommendation.get("signal"),
            "confidence": recommendation.get("confidence"),
            "urdu_explanation": urdu_explanation,
            "reasons": recommendation.get("reasons"),
        }
    except Exception as e:
        logger.error(f"Error generating Urdu recommendation: {e}")
        return {"error": "اسٹاک کی تجویز بنانے میں خرابی"}


# ── Portfolio Advisor & Daily Briefing ──────────────────────────────────────

from pydantic import BaseModel
from typing import Optional
from services.llm_service import LLMService

class PortfolioAdvisorRequest(BaseModel):
    holdings_json: str
    total_value: Optional[str] = None
    total_pnl: Optional[str] = None
    pnl_percent: Optional[str] = None
    top_sector: Optional[str] = None
    question: Optional[str] = None
    language: Optional[str] = "en"

@router.post("/portfolio-advisor", summary="Get customized AI advice on a portfolio")
async def get_portfolio_advice(payload: PortfolioAdvisorRequest):
    """
    Analyzes the user's holdings and portfolio metrics to generate bespoke rebalancing advice.
    """
    system_prompt = (
        "You are the AlphaAI Premium Portfolio Advisor. "
        "Analyze the provided portfolio composition and provide clear, professional, "
        "and actionable investment insights. Be extremely precise."
    )
    prompt = (
        f"Portfolio Data:\n"
        f"- Holdings: {payload.holdings_json}\n"
        f"- Total Value: {payload.total_value or 'N/A'}\n"
        f"- Total Profit/Loss: {payload.total_pnl or 'N/A'} ({payload.pnl_percent or 'N/A'})\n"
        f"- Top Sector: {payload.top_sector or 'N/A'}\n\n"
        f"User Question:\n{payload.question or 'Analyze my portfolio allocation and provide actionable rebalancing suggestions.'}"
    )
    if payload.language == "ur":
        prompt += "\nPlease respond in highly professional Urdu."

    response_text = await LLMService.complete(prompt, system_prompt)
    return {"response": response_text}

@router.get("/daily-briefing", summary="Get Daily AI Market Briefing")
async def get_daily_briefing():
    """
    Generates a concise, single-sentence market briefing summarizing international and local exchange trends.
    """
    system_prompt = (
        "You are the AlphaAI Market Narrator. "
        "Compile a single, punchy, informative sentence summarizing the market outlook. Do not include markdown."
    )
    prompt = "Synthesize today's market momentum including tech indices and PSX activity."
    briefing = await LLMService.complete(prompt, system_prompt)
    return {"briefing": briefing}

