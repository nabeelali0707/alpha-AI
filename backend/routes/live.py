"""
Live Market Endpoints
Real-time crypto, forex, commodities, and metals pricing
"""

import asyncio
import logging
from fastapi import APIRouter, Query

from services.live_market_service import LiveMarketService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/live", tags=["live-markets"])

# ============ Cryptocurrency Endpoints ============

@router.get("/crypto/all")
async def get_all_crypto(currency: str = Query("usd"), limit: int = Query(20)):
    """
    Get top cryptocurrencies with live prices (CoinGecko)
    
    Returns: Array of top 20 cryptos by market cap
    """
    return await LiveMarketService.get_all_crypto(currency, limit)


@router.get("/crypto/{symbol}")
async def get_crypto_live(symbol: str, currency: str = Query("usd", description="Target currency")):
    """
    Get live cryptocurrency price from CoinGecko
    
    Example: /live/crypto/BTC?currency=usd
    Returns: price, market_cap, volume_24h, change_24h
    """
    data = await LiveMarketService.get_crypto_price(symbol, currency)
    if not data:
        return {"error": f"Crypto {symbol} not found"}
    return data


# ============ Forex Endpoints ============

@router.get("/forex/all")
async def get_all_forex():
    """
    Get all major forex pairs with live rates
    
    Returns: Array of 15+ forex pairs including USD/PKR
    """
    return await LiveMarketService.get_all_forex()


@router.get("/forex/{pair}")
async def get_forex_live(pair: str):
    """
    Get live forex rates from ExchangeRate-API (perfect for PKR!)
    
    Example: /live/forex/USD/PKR
    Pairs available: USD/PKR, EUR/USD, GBP/USD, etc.
    """
    # Handle both "USD/PKR" and "USD-PKR" formats
    pair = pair.replace("-", "/").upper()
    data = await LiveMarketService.get_forex_rate(pair)
    if not data:
        return {"error": f"Forex pair {pair} not found"}
    return data


# ============ Commodities & Metals Endpoints ============

@router.get("/commodity/all")
async def get_all_commodities():
    """
    Get all commodity prices (metals, energy, agriculture)
    
    Returns: 10 commodities (gold, oil, agricultural products)
    """
    return await LiveMarketService.get_all_commodities()


@router.get("/commodity/{symbol}")
async def get_commodity_live(symbol: str):
    """
    Get live commodity prices (gold, oil, etc.)
    
    Available symbols:
    - GC=F (Gold)
    - SI=F (Silver)
    - CL=F (Crude Oil WTI)
    - NG=F (Natural Gas)
    - ZW=F (Wheat)
    - ZC=F (Corn)
    - CC=F (Cocoa)
    - CT=F (Cotton)
    - KC=F (Coffee)
    - SB=F (Sugar)
    """
    data = await LiveMarketService.get_commodity_price(symbol)
    if not data:
        return {"error": f"Commodity {symbol} not found"}
    return data


# ============ Watchlist & Dashboard Endpoints ============

@router.get("/watchlist/tradingview")
async def get_tradingview_watchlist():
    """
    Get complete TradingView-like watchlist
    Includes: crypto, forex, commodities, indices
    """
    try:
        # Fetch all data in parallel
        crypto_task = LiveMarketService.get_all_crypto("usd", 10)
        forex_task = LiveMarketService.get_all_forex()
        commodity_task = LiveMarketService.get_all_commodities()
        
        crypto, forex, commodities = await asyncio.gather(
            crypto_task, forex_task, commodity_task
        )
        
        return {
            "status": "success",
            "data": {
                "crypto": crypto,
                "forex": forex,
                "commodities": commodities,
                "timestamp": asyncio.get_event_loop().time(),
            }
        }
    
    except Exception as e:
        logger.error(f"Error fetching TradingView watchlist: {e}")
        return {"error": str(e), "status": "error"}


@router.get("/search")
async def search_all_markets(q: str = Query(..., description="Search query")):
    """
    Search across all markets
    
    Example: /live/search?q=BTC
    Returns: crypto, forex, commodities, stocks matching query
    """
    results = await LiveMarketService.search_markets(q)
    return {
        "query": q,
        "results": results,
        "timestamp": asyncio.get_event_loop().time(),
    }


# ============ Market Overview ============

@router.get("/overview")
async def get_market_overview():
    """
    Get market overview - top performers in each category
    """
    try:
        crypto = await LiveMarketService.get_all_crypto("usd", 5)
        forex = await LiveMarketService.get_all_forex()
        
        return {
            "status": "success",
            "overview": {
                "top_crypto": crypto[:5],
                "forex": forex[:5],
                "timestamp": asyncio.get_event_loop().time(),
            }
        }
    
    except Exception as e:
        logger.error(f"Error fetching market overview: {e}")
        return {"error": str(e), "status": "error"}
