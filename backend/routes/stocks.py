"""
Stock Routes — Step 4 & 15 (Enhanced with Swagger docs and response models)
"""

from fastapi import APIRouter, Query
from typing import List

from models.stock import StockPrice, StockHistoryEntry, StockMetadata, ErrorResponse
from services.stock_service import StockService

router = APIRouter()
stock_service = StockService()


@router.get(
    "/{symbol}",
    response_model=StockPrice,
    summary="Get current stock price",
    description="Fetch real-time price data for a given ticker symbol using yfinance.",
    responses={
        200: {"description": "Successfully retrieved stock price"},
        404: {"model": ErrorResponse, "description": "Ticker not found"},
    },
)
async def get_stock_price(symbol: str):
    """Fetch real-time price data for a given ticker symbol."""
    return stock_service.get_stock_price(symbol)


@router.get(
    "/{symbol}/info",
    response_model=StockMetadata,
    summary="Get company information",
    description="Fetch company metadata including sector, market cap, P/E ratio, and business description.",
    responses={
        200: {"description": "Successfully retrieved company info"},
        404: {"model": ErrorResponse, "description": "Ticker not found"},
    },
)
async def get_stock_info(symbol: str):
    """Fetch company metadata and fundamentals."""
    return stock_service.get_stock_info(symbol)


@router.get(
    "/{symbol}/history",
    response_model=List[StockHistoryEntry],
    summary="Get historical price data",
    description="Fetch OHLCV historical price data. Supports periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, ytd, max.",
    responses={
        200: {"description": "Successfully retrieved price history"},
        404: {"model": ErrorResponse, "description": "Ticker not found or no data"},
    },
)
async def get_stock_history(
    symbol: str,
    period: str = Query(default="1mo", description="Time period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, ytd, max"),
    interval: str = Query(default="1d", description="Data interval: 1m, 5m, 15m, 1h, 1d, 1wk, 1mo"),
):
    """Fetch historical OHLCV price data."""
    return stock_service.get_stock_history(symbol, period=period, interval=interval)
