"""
AlphaAI — Main Application Entry Point
Production-ready FastAPI backend for AI-powered Stock Market Analysis.
"""

import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from utils.config import settings
from utils.error_handlers import register_error_handlers
from routes import analysis, auth, portfolio, stocks

# ── Logging Setup ───────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("alphaai")

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
        "- 🎯 Combined dashboard endpoint for frontend consumption\n\n"
        "Built with FastAPI • Powered by HuggingFace Transformers"
    ),
    version=settings.app_version,
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
    ],
)

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
        "status": "operational",
        "version": settings.app_version,
        "app": settings.app_name,
    }


# ── Routers ─────────────────────────────────────────────────────────────────
app.include_router(stocks.router, prefix="/api/v1/stocks", tags=["Stocks"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["AI Analysis"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(portfolio.router, prefix="/api/v1/portfolio", tags=["Portfolio"])

# ── Root ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["System"], include_in_schema=False)
async def root():
    return {
        "message": "🐉 Welcome to AlphaAI — AI-Powered Stock Market Analyzer",
        "docs": "/docs",
        "health": "/health",
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
