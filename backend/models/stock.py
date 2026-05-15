"""
Pydantic response models for the AlphaAI API — Step 15 (Enhanced)
Provides rich Swagger documentation with examples and field descriptions.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


# ── Stock Models ────────────────────────────────────────────────────────────

class StockPrice(BaseModel):
    """Real-time stock price data."""
    symbol: str = Field(..., example="AAPL", description="Ticker symbol")
    price: float = Field(..., example=189.84, description="Current market price in USD")
    change: float = Field(..., example=2.35, description="Price change from previous close")
    change_percent: float = Field(..., example=1.25, description="Percentage change")
    timestamp: str = Field(..., example="2026-05-15T09:30:00", description="ISO timestamp")


class StockHistoryEntry(BaseModel):
    """Single historical OHLCV data point."""
    date: str = Field(..., example="2026-05-14", description="Trading date")
    open: float = Field(..., example=187.50)
    high: float = Field(..., example=191.20)
    low: float = Field(..., example=186.90)
    close: float = Field(..., example=189.84)
    volume: int = Field(..., example=45000000)


class StockMetadata(BaseModel):
    """Company metadata and fundamentals."""
    symbol: str = Field(..., example="AAPL")
    name: Optional[str] = Field(None, example="Apple Inc.")
    sector: Optional[str] = Field(None, example="Technology")
    industry: Optional[str] = Field(None, example="Consumer Electronics")
    market_cap: Optional[int] = Field(None, example=2900000000000)
    pe_ratio: Optional[float] = Field(None, example=28.5)
    dividend_yield: Optional[float] = Field(None, example=0.0055)
    fifty_two_week_high: Optional[float] = Field(None, example=199.62)
    fifty_two_week_low: Optional[float] = Field(None, example=164.08)
    description: Optional[str] = Field(None, description="Company business summary")
    website: Optional[str] = Field(None, example="https://www.apple.com")


# ── Sentiment Models ───────────────────────────────────────────────────────

class HeadlineSentiment(BaseModel):
    """Sentiment analysis of a single headline."""
    label: str = Field(..., example="positive", description="Sentiment label")
    confidence: float = Field(..., example=0.9234, description="Model confidence 0-1")
    all_scores: Dict[str, float] = Field(
        default_factory=dict,
        example={"positive": 0.92, "negative": 0.04, "neutral": 0.04},
    )


class HeadlineResult(BaseModel):
    """News headline with its sentiment analysis."""
    headline: str = Field(..., example="Apple reports record quarterly earnings")
    source: str = Field(..., example="Bloomberg")
    url: str = Field(default="", example="https://bloomberg.com/...")
    published_date: str = Field(default="", example="2026-05-15T08:00:00Z")
    sentiment: HeadlineSentiment


class SentimentBreakdown(BaseModel):
    """Counts of positive/negative/neutral headlines."""
    positive: int = Field(default=0, example=3)
    negative: int = Field(default=0, example=1)
    neutral: int = Field(default=0, example=1)


class SentimentResult(BaseModel):
    """Full sentiment analysis result for a stock ticker."""
    symbol: str = Field(..., example="AAPL")
    score: float = Field(..., example=0.45, description="Aggregate sentiment score")
    label: str = Field(..., example="BULLISH", description="BULLISH / BEARISH / NEUTRAL")
    total_articles: int = Field(default=0, example=5)
    breakdown: SentimentBreakdown = Field(default_factory=SentimentBreakdown)
    headlines: List[HeadlineResult] = Field(default_factory=list)
    indicators: List[str] = Field(
        default_factory=list,
        example=["Majority positive sentiment (3/5 headlines)"],
    )


# ── Technical Indicator Models ──────────────────────────────────────────────

class RSIData(BaseModel):
    value: float = Field(..., example=55.32)
    period: int = Field(default=14, example=14)
    signal: str = Field(..., example="NEUTRAL", description="OVERBOUGHT / OVERSOLD / NEUTRAL")


class MovingAverageData(BaseModel):
    sma_20: Optional[float] = Field(None, example=188.50)
    sma_50: Optional[float] = Field(None, example=185.20)
    sma_200: Optional[float] = Field(None, example=178.90)
    ema_12: float = Field(..., example=189.10)
    ema_26: float = Field(..., example=187.40)
    current_price: float = Field(..., example=189.84)
    trend: str = Field(..., example="GOLDEN_CROSS")


class MACDData(BaseModel):
    macd_line: float = Field(..., example=1.7023)
    signal_line: float = Field(..., example=1.2148)
    histogram: float = Field(..., example=0.4875)
    signal: str = Field(..., example="BULLISH")


class VolatilityData(BaseModel):
    daily_volatility: float = Field(..., example=0.0182)
    annualized_volatility: float = Field(..., example=0.2891)
    risk_level: str = Field(..., example="MODERATE")
    window: int = Field(default=20, example=20)


class TechnicalIndicators(BaseModel):
    """All technical indicators for a stock."""
    symbol: str = Field(..., example="AAPL")
    rsi: RSIData
    moving_averages: MovingAverageData
    macd: MACDData
    volatility: VolatilityData


# ── Recommendation Models ──────────────────────────────────────────────────

class SentimentSummary(BaseModel):
    label: str = Field(..., example="BULLISH")
    score: float = Field(..., example=0.45)
    total_articles: int = Field(default=0, example=5)
    breakdown: SentimentBreakdown = Field(default_factory=SentimentBreakdown)


class Recommendation(BaseModel):
    """AI-powered stock recommendation."""
    symbol: str = Field(..., example="AAPL")
    recommendation: str = Field(..., example="BUY", description="BUY / SELL / HOLD")
    confidence: float = Field(..., example=0.72, description="Confidence score 0-1")
    score: float = Field(..., example=72.0, description="Raw score out of 100")
    explanation: str = Field(..., description="Human-readable AI explanation")
    reasons: List[str] = Field(default_factory=list)
    technical_indicators: Optional[TechnicalIndicators] = None
    sentiment_summary: Optional[SentimentSummary] = None
    price_data: Optional[StockPrice] = None


# ── Dashboard Model ────────────────────────────────────────────────────────

class DashboardResponse(BaseModel):
    """Combined dashboard data — a single frontend-ready JSON object."""
    symbol: str = Field(..., example="AAPL")
    price: StockPrice
    history: List[StockHistoryEntry] = Field(default_factory=list)
    metadata: Optional[StockMetadata] = None
    sentiment: Optional[SentimentResult] = None
    recommendation: Optional[Recommendation] = None
    technical_indicators: Optional[TechnicalIndicators] = None


# ── Error Model ─────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str = Field(..., example="Invalid ticker symbol")
    detail: str = Field(default="", example="No data found for ticker XYZ123")
    status_code: int = Field(default=400, example=400)


# ── News Models ─────────────────────────────────────────────────────────────

class NewsArticle(BaseModel):
    """A single news article."""
    headline: str = Field(..., example="Apple announces new AI features")
    source: str = Field(..., example="CNBC")
    url: str = Field(default="", example="https://cnbc.com/...")
    published_date: str = Field(default="", example="2026-05-15T08:00:00Z")
    description: str = Field(default="", example="Apple unveils next-gen AI capabilities")
