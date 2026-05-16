"""
Stock Routes — Step 4 & 15 (Enhanced with Swagger docs and response models)
"""

from fastapi import APIRouter, Query
from typing import List

from models.stock import (
    StockPrice,
    StockHistoryEntry,
    StockMetadata,
    ErrorResponse,
    MarketOverviewResponse,
    MarketItem,
    AutocompleteResult,
)
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


@router.get(
    "/{symbol}/financials",
    summary="Get financial statements",
    description=(
        "Fetch the company's core financial statements — income statement, "
        "balance sheet, and cash flow — sourced from yfinance. "
        "Each statement is keyed by reporting date with line-item breakdowns."
    ),
    responses={
        200: {"description": "Successfully retrieved financial statements"},
        404: {"description": "Ticker not found or no financial data available"},
    },
)
async def get_stock_financials(symbol: str):
    """Fetch income statement, balance sheet, and cash flow data."""
    return stock_service.get_financials(symbol)


@router.get(
    "/{symbol}/actions",
    summary="Get corporate actions",
    description=(
        "Fetch historical dividends and stock splits for a given ticker. "
        "Dates are returned as string keys in YYYY-MM-DD format."
    ),
    responses={
        200: {"description": "Successfully retrieved corporate actions"},
        404: {"description": "Ticker not found or no corporate actions available"},
    },
)
async def get_stock_actions(symbol: str):
    """Fetch historical dividends and stock splits."""
    return stock_service.get_corporate_actions(symbol)


@router.get(
    "/market/overview",
    response_model=MarketOverviewResponse,
    summary="Get global market overview",
    description="Returns grouped market data for PSX, US, crypto, forex, commodities, and indices.",
)
async def get_market_overview():
    return stock_service.get_market_overview()


@router.get(
    "/market/psx",
    response_model=List[MarketItem],
    summary="Get PSX market overview",
    description="Returns PSX market data grouped for Pakistan Stock Exchange tickers.",
)
async def get_market_psx():
    return stock_service.get_market_category("PSX")


@router.get(
    "/market/crypto",
    response_model=List[MarketItem],
    summary="Get crypto market overview",
    description="Returns crypto market data.",
)
async def get_market_crypto():
    return stock_service.get_market_category("CRYPTO")


@router.get(
    "/market/forex",
    response_model=List[MarketItem],
    summary="Get forex market overview",
    description="Returns forex market data.",
)
async def get_market_forex():
    return stock_service.get_market_category("FOREX")


@router.get(
    "/search/autocomplete",
    response_model=List[AutocompleteResult],
    summary="Autocomplete stock symbols",
    description="Search PSX symbols first, then yfinance for matching tickers.",
)
async def autocomplete_search(
    q: str = Query(..., description="Search query"),
    limit: int = Query(default=10, ge=1, le=20, description="Max results"),
):
    return stock_service.search_autocomplete(q, limit=limit)

