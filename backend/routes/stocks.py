from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from services.stock_service import StockService

router = APIRouter()
stock_service = StockService()

@router.get("/{symbol}")
async def get_stock_price(symbol: str):
    """Fetch real-time price data for a given ticker symbol."""
    return stock_service.get_stock_price(symbol)

@router.get("/{symbol}/metadata")
async def get_stock_metadata(symbol: str):
    """Fetch company metadata and fundamentals."""
    return stock_service.get_stock_info(symbol)

@router.get("/{symbol}/history")
async def get_stock_history(symbol: str, period: str = "1mo"):
    """Fetch historical price data."""
    return stock_service.get_stock_history(symbol, period=period)
