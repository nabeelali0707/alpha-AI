# 🐉 DRAGON2 — Phase 3: Real-Time WebSocket Streaming

## Overview

This update adds **real-time price streaming** to AlphaAI via WebSockets. A background broadcaster fetches baseline closing prices from **yfinance** for a mix of US and PSX (Pakistan Stock Exchange) equities, then simulates realistic intra-day tick fluctuations and pushes them to all connected clients every 4 seconds. The frontend receives these ticks and renders them in a premium, animated **live ticker tape** at the top of the dashboard.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                             │
│                                                                  │
│  ┌─────────────────┐    ┌──────────────────────────────────┐     │
│  │   Lifespan       │───▶│  price_broadcaster()             │     │
│  │   (main.py)      │    │  • Seeds baselines via yfinance  │     │
│  │                  │    │  • Simulates ticks every 4s       │     │
│  └─────────────────┘    │  • Calls manager.broadcast_json() │     │
│                          └────────────┬─────────────────────┘     │
│                                       │                           │
│  ┌─────────────────────────┐          ▼                           │
│  │  ConnectionManager      │◀─── broadcast_json(payload)         │
│  │  (ws_manager.py)        │                                      │
│  │  • connect / disconnect │                                      │
│  │  • stale-conn cleanup   │                                      │
│  └────────┬────────────────┘                                      │
│           │  ws://localhost:8001/api/v1/ws/prices                 │
└───────────┼──────────────────────────────────────────────────────┘
            │
            │ WebSocket (JSON frames)
            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐            │
│  │  LiveTicker.tsx                                   │            │
│  │  • Connects to ws:// endpoint                     │            │
│  │  • Listens for PRICE_UPDATE messages              │            │
│  │  • Renders animated scrolling ticker tape         │            │
│  │  • Auto-reconnects on disconnect                  │            │
│  └──────────────────────────────────────────────────┘            │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐            │
│  │  Dashboard (page.tsx)                             │            │
│  │  • LiveTicker injected at top of layout           │            │
│  └──────────────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────────┘
```

---

## WebSocket Endpoint

| Protocol | URL                                         | Purpose                                    |
| -------- | ------------------------------------------- | ------------------------------------------ |
| `ws://`  | `localhost:8001/api/v1/ws/prices`            | Real-time price tick streaming             |

### Message Format (Server → Client)

```json
{
  "type": "PRICE_UPDATE",
  "data": [
    {
      "symbol": "AAPL",
      "price": 195.42,
      "change": 0.42,
      "change_percent": 0.22,
      "volume": 12500000,
      "timestamp": "2026-05-17T00:30:00+00:00"
    }
  ],
  "timestamp": "2026-05-17T00:30:00+00:00"
}
```

---

## Background Broadcasting Logic

1. **Baseline Seeding** — On server startup, `price_broadcaster()` calls `_seed_baselines()`, which fetches the most recent closing price for each ticker via `yfinance` (using `fast_info` first, falling back to `history()`). This runs in a thread-pool executor to avoid blocking the event loop.

2. **Tick Simulation** — Every 4 seconds, `_simulate_tick()` applies a random walk with mean-reversion to each ticker's previous price:
   - **Volatility**: ~0.15% per tick (realistic intra-day noise)
   - **Mean-reversion**: 5% pull towards yfinance baseline
   - **Bounds**: Price clamped to ±10% of baseline

3. **Broadcast** — If at least one WebSocket client is connected, the full tick array is wrapped in a `PRICE_UPDATE` JSON frame and broadcast via `ConnectionManager.broadcast_json()`. Stale connections are automatically pruned.

---

## Tracked Tickers

| Category | Symbols                                       |
| -------- | --------------------------------------------- |
| US       | AAPL, NVDA, MSFT, TSLA, AMZN, META           |
| PSX      | SYS.KA, HUBC.KA, ENGRO.KA, OGDC.KA          |

---

## Connection Lifecycle

```
Client connects → ws.accept() → added to active_connections pool
  ↓
Server pushes PRICE_UPDATE every 4s
  ↓
Client disconnects (or error) → removed from pool → auto-reconnect (frontend)
  ↓
Server shutdown → broadcaster_task.cancel() → clean exit
```

---

## Frontend Component: LiveTicker

- **Auto-connect** to the WebSocket URL (configurable via `NEXT_PUBLIC_ALPHAAI_WS_URL`)
- **Auto-reconnect** on disconnection (3-second delay)
- **Animated ticker tape** with smooth infinite horizontal scroll
- **LIVE badge** with pulsing indicator dot (green = connected, red = disconnected)
- **Edge fades** for premium visual polish
- **Hover-to-pause** the scrolling animation
- **Error state** with "reconnecting…" message when backend is unavailable
- **Shimmer loading state** while waiting for the first tick

---

## Environment Variables

| Variable                      | File            | Default                                        |
| ----------------------------- | --------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_ALPHAAI_WS_URL`  | `frontend/.env` | `ws://localhost:8001/api/v1/ws/prices`          |

---

## Files Created / Modified

| File                                         | Change                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| `backend/utils/ws_manager.py`                | **[NEW]** ConnectionManager class for WebSocket connection tracking    |
| `backend/routes/ws_live.py`                  | **[NEW]** WebSocket endpoint + `price_broadcaster` background task     |
| `backend/routes/__init__.py`                 | Added `ws_live` to module imports                                      |
| `backend/main.py`                            | Added lifespan context manager, ws_live router at `/api/v1/ws`        |
| `frontend/src/components/LiveTicker.tsx`     | **[NEW]** Real-time WebSocket ticker tape component                    |
| `frontend/src/app/dashboard/page.tsx`        | Imported and injected `LiveTicker` at top of dashboard                |
| `frontend/.env`                              | Added `NEXT_PUBLIC_ALPHAAI_WS_URL` variable                           |
| `DRAGON2.md`                                 | **[NEW]** This documentation file                                      |

---

## Running Locally

```bash
# Terminal 1 — Backend
cd backend
python main.py
# Broadcaster starts automatically, seeding yfinance baselines

# Terminal 2 — Frontend
cd frontend
npm run dev
# Open http://localhost:3000/dashboard → live ticker tape at top
```

---

*Phase 3 complete. The AlphaAI dashboard now streams real-time price data via WebSockets.* 🐉
