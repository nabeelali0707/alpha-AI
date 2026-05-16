"""
Real-Time WebSocket Price Streaming
Broadcasts simulated live tick data for US & PSX equities.
Baselines are seeded from yfinance; ticks fluctuate realistically around them.
"""

import asyncio
import logging
import random
from datetime import datetime, timezone
from typing import Dict, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from utils.ws_manager import ConnectionManager

logger = logging.getLogger("alphaai.ws.live")

router = APIRouter()
manager = ConnectionManager()

# ── Ticker Universe ─────────────────────────────────────────────────────────
# Mix of US blue-chips and PSX (Pakistan Stock Exchange) tickers.
# PSX tickers use the ".KA" (Karachi) suffix recognised by yfinance.
TICKERS = [
    # US equities
    "AAPL",
    "NVDA",
    "MSFT",
    "TSLA",
    "AMZN",
    "META",
    # PSX equities (Karachi exchange)
    "SYS.KA",
    "HUBC.KA",
    "ENGRO.KA",
    "OGDC.KA",
]

# Fallback prices used when yfinance is unavailable or returns nothing.
FALLBACK_PRICES: Dict[str, float] = {
    "AAPL": 195.00,
    "NVDA": 135.00,
    "MSFT": 430.00,
    "TSLA": 175.00,
    "AMZN": 185.00,
    "META": 505.00,
    "SYS.KA": 540.00,
    "HUBC.KA": 165.00,
    "ENGRO.KA": 310.00,
    "OGDC.KA": 115.00,
}

# Runtime state — populated once at startup by _seed_baselines()
_baselines: Dict[str, float] = {}
_previous_prices: Dict[str, float] = {}

BROADCAST_INTERVAL_SECONDS = 4  # How often ticks are pushed


# ── Baseline Seeding ────────────────────────────────────────────────────────

async def _seed_baselines() -> None:
    """
    Fetch the most recent closing price for each ticker via yfinance.
    Runs in a thread-pool executor so the event loop is not blocked.
    """
    loop = asyncio.get_running_loop()

    def _fetch() -> Dict[str, float]:
        prices: Dict[str, float] = {}
        try:
            import yfinance as yf

            for symbol in TICKERS:
                try:
                    ticker = yf.Ticker(symbol)
                    # Try fast_info first (lighter)
                    fast = getattr(ticker, "fast_info", None)
                    price: Optional[float] = None
                    if fast:
                        price = fast.get("last_price") or fast.get("previousClose")

                    # Fallback to history
                    if price is None:
                        hist = ticker.history(period="5d", interval="1d")
                        if hist is not None and not hist.empty:
                            price = float(hist["Close"].iloc[-1])

                    if price and price > 0:
                        prices[symbol] = round(price, 2)
                        logger.info("Seeded %s → $%.2f", symbol, price)
                    else:
                        prices[symbol] = FALLBACK_PRICES.get(symbol, 100.0)
                        logger.warning(
                            "No yfinance data for %s — using fallback $%.2f",
                            symbol,
                            prices[symbol],
                        )
                except Exception as exc:
                    prices[symbol] = FALLBACK_PRICES.get(symbol, 100.0)
                    logger.warning("yfinance error for %s: %s — using fallback", symbol, exc)
        except ImportError:
            logger.error("yfinance not installed — using all fallback prices")
            prices = dict(FALLBACK_PRICES)

        return prices

    fetched = await loop.run_in_executor(None, _fetch)
    _baselines.update(fetched)
    _previous_prices.update(fetched)
    logger.info("Baseline seeding complete for %d tickers", len(_baselines))


# ── Tick Simulation ─────────────────────────────────────────────────────────

def _simulate_tick(symbol: str) -> dict:
    """
    Generate a realistic tick for *symbol* by applying a small random
    walk around its baseline price.  The drift is mean-reverting so
    prices don't wander too far from the yfinance baseline.
    """
    baseline = _baselines.get(symbol, FALLBACK_PRICES.get(symbol, 100.0))
    prev = _previous_prices.get(symbol, baseline)

    # Volatility scaled to ~0.15 % per tick (realistic intra-day)
    volatility = baseline * 0.0015
    noise = random.gauss(0, volatility)

    # Mean-reversion pull towards baseline (strength 0.05)
    reversion = 0.05 * (baseline - prev)

    new_price = round(prev + noise + reversion, 2)
    new_price = max(new_price, baseline * 0.90)  # floor at -10 %
    new_price = min(new_price, baseline * 1.10)  # cap at +10 %

    change = round(new_price - baseline, 2)
    change_pct = round((change / baseline) * 100, 2) if baseline else 0.0

    _previous_prices[symbol] = new_price

    return {
        "symbol": symbol,
        "price": new_price,
        "change": change,
        "change_percent": change_pct,
        "volume": random.randint(100_000, 25_000_000),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ── Background Broadcaster ─────────────────────────────────────────────────

async def price_broadcaster() -> None:
    """
    Long-running coroutine started at application lifespan.
    Every BROADCAST_INTERVAL_SECONDS it pushes a PRICE_UPDATE
    message to all connected WebSocket clients.
    """
    logger.info("Price broadcaster started (interval=%ds)", BROADCAST_INTERVAL_SECONDS)

    # Seed baseline prices from yfinance on first run
    await _seed_baselines()

    while True:
        if manager.client_count > 0:
            tickers_data = [_simulate_tick(sym) for sym in TICKERS]
            payload = {
                "type": "PRICE_UPDATE",
                "data": tickers_data,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            await manager.broadcast_json(payload)
            logger.debug(
                "Broadcast %d ticks to %d clients",
                len(tickers_data),
                manager.client_count,
            )
        await asyncio.sleep(BROADCAST_INTERVAL_SECONDS)


# ── WebSocket Endpoint ──────────────────────────────────────────────────────

@router.websocket("/prices")
async def ws_prices(websocket: WebSocket):
    """
    WebSocket endpoint for live price streaming.
    Clients connect here to receive PRICE_UPDATE messages.
    """
    await manager.connect(websocket)
    try:
        # Keep the connection alive — listen for client pings / close
        while True:
            # We don't expect meaningful messages from the client,
            # but we need to await something so FastAPI keeps the
            # connection open.  receive_text() will raise
            # WebSocketDisconnect when the client drops.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
