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


# ============ Real-time WebSocket Telemetry ============

from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import json
import yfinance as yf

class ConnectionManager:
    """Manages active live-market WebSocket client channels."""
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("New WebSocket client successfully established secure channel.")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client session channel disconnected.")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

async def send_market_data(websocket: WebSocket, symbols: list[str]):
    """Fetches real-time price updates from live market providers and feeds client."""
    payload = {}
    for sym in symbols:
        try:
            sym_upper = sym.upper().strip()
            if "PKR" in sym_upper or "/" in sym_upper or "-" in sym_upper and not sym_upper.endswith("-USD"):
                # Forex pair (e.g. USD/PKR, EUR/USD)
                clean_pair = sym_upper.replace("-", "/")
                pair_data = await LiveMarketService.get_forex_rate(clean_pair)
                if pair_data:
                    payload[sym_upper] = {
                        "type": "forex",
                        "price": float(pair_data.get("rate", 0)),
                        "change": 0.0,
                        "change_percent": 0.0
                    }
            elif sym_upper in ["BTC-USD", "ETH-USD", "SOL-USD", "BTC", "ETH", "SOL"]:
                # Cryptocurrencies
                crypto_id = sym_upper.replace("-USD", "")
                crypto_data = await LiveMarketService.get_crypto_price(crypto_id, "usd")
                if crypto_data:
                    payload[sym_upper] = {
                        "type": "crypto",
                        "price": float(crypto_data.get("price", 0)),
                        "change": float(crypto_data.get("change_24h", 0)),
                        "change_percent": float(crypto_data.get("change_24h", 0))
                    }
            else:
                # Standard Stock Tickers (yfinance US or local PSX symbols)
                stock = yf.Ticker(sym_upper)
                fast_info = getattr(stock, "fast_info", None)
                price = None
                prev_close = None
                
                if fast_info:
                    price = fast_info.get("last_price")
                    prev_close = fast_info.get("previous_close")
                    
                if price is None:
                    # Fallback to general history
                    hist = stock.history(period="2d")
                    if len(hist) >= 2:
                        price = hist["Close"].iloc[-1]
                        prev_close = hist["Close"].iloc[-2]
                
                if price is not None and prev_close is not None:
                    change = price - prev_close
                    change_pct = (change / prev_close) * 100.0
                    payload[sym_upper] = {
                        "type": "stock",
                        "price": round(float(price), 2),
                        "change": round(float(change), 2),
                        "change_percent": round(float(change_pct), 2)
                    }
        except Exception as e:
            logger.error(f"Error fetching real-time feed for ticker {sym} inside WS worker: {e}")

    if payload:
        await websocket.send_json({
            "event": "market_update",
            "data": payload,
            "timestamp": datetime.now().isoformat()
        })

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time market subscriptions.
    Clients subscribe via: {"action": "subscribe", "symbols": ["AAPL", "BTC-USD"]}
    """
    await manager.connect(websocket)
    subscriptions = set()
    try:
        async def client_listener():
            try:
                while True:
                    data = await websocket.receive_text()
                    parsed = json.loads(data)
                    action = parsed.get("action")
                    symbols = parsed.get("symbols", [])
                    if action == "subscribe":
                        for sym in symbols:
                            subscriptions.add(sym.upper())
                        logger.info(f"WS Subscribed symbols: {list(subscriptions)}")
                        # Send instant update
                        await send_market_data(websocket, list(subscriptions))
                    elif action == "unsubscribe":
                        for sym in symbols:
                            subscriptions.discard(sym.upper())
                        logger.info(f"WS Unsubscribed: {symbols}")
            except WebSocketDisconnect:
                pass
            except Exception as e:
                logger.error(f"WS client listener exception: {e}")

        async def data_sender():
            try:
                while True:
                    if subscriptions:
                        await send_market_data(websocket, list(subscriptions))
                    await asyncio.sleep(5) # High frequency updates every 5 seconds
            except WebSocketDisconnect:
                pass
            except Exception as e:
                logger.error(f"WS data sender exception: {e}")

        # Concurrently route incoming messages and stream outgoing market pricing
        await asyncio.gather(client_listener(), data_sender())

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)
        logger.error(f"WS root endpoint exception: {e}")

