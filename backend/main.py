"""
AlphaAI — Main Application Entry Point
Production-ready FastAPI backend for AI-powered Stock Market Analysis.
"""

import asyncio
import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from utils.config import settings
from utils.error_handlers import register_error_handlers
from utils.limiter import limiter
from models.stock import SimpleStockSummary
from routes import analysis, auth, portfolio, stocks, search, live, alerts, ai_features, chat, market_brief, events
from routes import ws_live

# ── Logging Setup ───────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("alphaai")


# ── Lifespan — start / stop the WebSocket price broadcaster ────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage background tasks tied to the application lifecycle."""
    logger.info("🚀 Starting WebSocket price broadcaster…")
    broadcaster_task = asyncio.create_task(ws_live.price_broadcaster())
    logger.info("🚀 Starting price event detector…")
    event_task = asyncio.create_task(events.detect_price_events_loop())
    yield
    logger.info("🛑 Shutting down WebSocket price broadcaster…")
    broadcaster_task.cancel()
    logger.info("🛑 Shutting down price event detector…")
    event_task.cancel()
    try:
        await broadcaster_task
        await event_task
    except asyncio.CancelledError:
        logger.info("Price broadcaster cancelled cleanly")


# ── FastAPI App ─────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.app_name,
    description=(
        "🐉 **AlphaAI** — AI-Powered Stock Market Analyzer\n\n"
        "Production-ready REST API providing:\n"
        "- 📈 Real-time stock data via yfinance\n"
        "- 🤖 AI sentiment analysis using FinBERT\n"
        "- 💡 Algorithmic BUY/SELL/HOLD recommendations\n"
        "- 📊 Technical indicators (RSI, MACD, Moving Averages)\n"
        "- 📰 Live financial news aggregation\n"
        "- 🎯 Combined dashboard endpoint for frontend consumption\n"
        "- 🔌 Real-time WebSocket price streaming\n\n"
        "Built with FastAPI • Powered by HuggingFace Transformers"
    ),
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "System",
            "description": "Health checks and system status",
        },
        {
            "name": "Stocks",
            "description": "Real-time stock prices, historical data, and company metadata",
        },
        {
            "name": "AI Analysis",
            "description": "AI-powered sentiment analysis, recommendations, technical indicators, news, and dashboard",
        },
        {
            "name": "WebSocket",
            "description": "Real-time price streaming via WebSocket connections",
        },
    ],
)

# ── Rate Limiting ─────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── CORS Middleware ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Centralized Error Handlers ─────────────────────────────────────────────────
register_error_handlers(app)

# ── Health Check ────────────────────────────────────────────────────────────
@app.get(
    "/health",
    tags=["System"],
    summary="Health check",
    description="Returns the operational status of the AlphaAI API.",
    response_description="System status payload",
)
async def health_check():
    return {
        "status": "ok",
        "version": settings.app_version,
        "app": settings.app_name,
    }


# ── Routers ─────────────────────────────────────────────────────────────────
app.include_router(stocks.router, prefix="/api/v1/stocks", tags=["Stocks"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["AI Analysis"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(portfolio.router, prefix="/api/v1/portfolio", tags=["Portfolio"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])
app.include_router(live.router, prefix="/api/v1", tags=["Live Markets"])
app.include_router(ws_live.router, prefix="/api/v1/ws", tags=["WebSocket"])
app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])
app.include_router(market_brief.router, prefix="/api/v1", tags=["Market"])
app.include_router(events.router, prefix="/api/v1", tags=["Events"])
app.include_router(alerts.router, prefix="/api/v1", tags=["Alerts"])
app.include_router(ai_features.router, prefix="/api/v1/ai", tags=["AI Features"])

# ── Root ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["System"], include_in_schema=False)
async def root():
    return {
        "message": "🐉 Welcome to AlphaAI — AI-Powered Stock Market Analyzer",
        "docs": "/docs",
        "health": "/health",
    }


@app.get(
    "/stock/{ticker}",
    response_model=SimpleStockSummary,
    tags=["System"],
    summary="Get basic stock info",
    description="Fetch the current price, company name, market cap, and volume for a ticker using yfinance.",
)
async def get_simple_stock(ticker: str):
    from services.stock_service import YAHOO_RATE_LIMITED, YAHOO_RATE_LIMIT_UNTIL

    if YAHOO_RATE_LIMITED and __import__("time").time() < YAHOO_RATE_LIMIT_UNTIL:
        raise HTTPException(status_code=503, detail="Yahoo Finance rate-limited — try again in a few minutes")

    try:
        import yfinance as yf
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"yfinance import failed: {str(exc)}")

    stock = yf.Ticker(ticker)
    info = {}
    price = None
    company_name = None
    market_cap = None
    volume = None

    # Prefer fast_info where possible because it's usually lighter than full stock.info.
    try:
        fi = stock.fast_info
        price = getattr(fi, "last_price", None)
        volume = getattr(fi, "volume", None) or volume
    except Exception:
        pass

    if price is None:
        try:
            hist = stock.history(period="5d", interval="1d")
            if hist is not None and not hist.empty:
                price = hist["Close"].iloc[-1]
                volume = int(hist["Volume"].iloc[-1]) if volume is None else volume
        except Exception:
            pass

    if price is None:
        raise HTTPException(status_code=404, detail=f"No stock data available for ticker {ticker}")

    return {
        "symbol": ticker.upper(),
        "company_name": company_name,
        "price": float(price) if price is not None else None,
        "market_cap": int(market_cap) if market_cap is not None else None,
        "volume": int(volume) if volume is not None else None,
    }


# ── Entry Point ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
