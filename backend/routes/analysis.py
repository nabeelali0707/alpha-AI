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

from fastapi import APIRouter

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

router = APIRouter()
sentiment_service = SentimentService()
recommender_service = RecommenderService()
technical_service = TechnicalService()
news_service = NewsService()
stock_service = StockService()


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
    return await recommender_service.generate_recommendation(symbol)


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
async def get_dashboard(symbol: str):
    """
    Assemble a complete dashboard view for a single ticker.
    Combines all available data into one frontend-ready response.
    """
    import asyncio

    # Fetch independent data concurrently
    price = stock_service.get_stock_price(symbol)
    history = stock_service.get_stock_history(symbol, period="1mo")
    metadata = stock_service.get_stock_info(symbol)
    technicals = technical_service.get_all_indicators(symbol)

    # Async data
    sentiment = await sentiment_service.analyze(symbol)
    recommendation = await recommender_service.generate_recommendation(symbol)

    return {
        "symbol": symbol.upper(),
        "price": price,
        "history": history,
        "metadata": metadata,
        "sentiment": sentiment,
        "recommendation": recommendation,
        "technical_indicators": technicals,
    }
