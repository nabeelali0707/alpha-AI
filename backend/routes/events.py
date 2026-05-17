"""
Price event detection and retrieval routes.
Detects >3% daily moves and stores AI explanations in Supabase.
"""

from __future__ import annotations

import asyncio
import json
import time
import uuid
from typing import Any, Dict, List

from fastapi import APIRouter
from openai import AsyncOpenAI

from services.stock_service import StockService
from utils.config import settings
from utils.supabase_client import get_supabase_client

router = APIRouter(prefix="/events", tags=["events"])
stock_service = StockService()

TRACKED = ["AAPL", "NVDA", "MSFT", "TSLA", "ENGRO.KA", "HBL.KA", "LUCK.KA", "OGDC.KA"]
CHECK_INTERVAL_SECONDS = 600  # 10 minutes — reduces Yahoo rate-limit pressure

_in_memory_events: List[Dict[str, Any]] = []
_last_seen: Dict[str, float] = {}


async def _explain_move(symbol: str, price_data: Dict[str, Any]) -> str:
    if not settings.groq_api_key:
        return f"{symbol} moved sharply today. Monitor volume, market sentiment, and sector headlines."

    client = AsyncOpenAI(api_key=settings.groq_api_key, base_url="https://api.groq.com/openai/v1")
    prompt = (
        "Explain this one-day stock move in 3 concise sentences for retail investors. "
        "Use only given data and mention uncertainty when needed."
        f"\nData: {json.dumps(price_data, ensure_ascii=False)}"
    )
    try:
        result = await client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            temperature=0.2,
            messages=[
                {"role": "system", "content": "You are AlphaAI event analyst. Never guarantee profits."},
                {"role": "user", "content": prompt},
            ],
        )
        if result.choices:
            return result.choices[0].message.content or "Price moved sharply today."
    except Exception:
        pass
    return f"{symbol} moved sharply today. Monitor volume, market sentiment, and sector headlines."


def _save_event(event: Dict[str, Any]) -> None:
    _in_memory_events.insert(0, event)
    del _in_memory_events[100:]

    sb = get_supabase_client()
    if not sb:
        return

    payload = {
        "id": event["id"],
        "ticker": event["ticker"],
        "change_pct": event["change_pct"],
        "direction": event["direction"],
        "price": event["price"],
        "explanation": event["explanation"],
        "dismissed": False,
        "created_at": event["created_at"],
    }
    try:
        sb.table("price_events").upsert(payload).execute()
    except Exception:
        # Keep in-memory fallback alive when table is missing.
        return


def _load_events(limit: int = 10) -> List[Dict[str, Any]]:
    sb = get_supabase_client()
    if sb:
        try:
            result = (
                sb.table("price_events")
                .select("*")
                .eq("dismissed", False)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            if result.data is not None:
                return result.data
        except Exception:
            pass
    return [event for event in _in_memory_events if not event.get("dismissed")][:limit]


async def detect_price_events_loop() -> None:
    while True:
        now = time.time()

        for symbol in TRACKED:
            try:
                price = stock_service.get_stock_price(symbol)
                change_pct = float(price.get("change_percent", 0) or 0)

                if abs(change_pct) >= 3:
                    # Debounce repeated events per ticker.
                    if now - _last_seen.get(symbol, 0) >= CHECK_INTERVAL_SECONDS:
                        explanation = await _explain_move(symbol, price)
                        event = {
                            "id": str(uuid.uuid4()),
                            "ticker": symbol,
                            "change_pct": round(change_pct, 2),
                            "direction": "up" if change_pct >= 0 else "down",
                            "price": float(price.get("price", 0) or 0),
                            "explanation": explanation,
                            "dismissed": False,
                            "created_at": price.get("timestamp"),
                        }
                        _save_event(event)
                        _last_seen[symbol] = now
            except Exception:
                pass

            # Stagger: wait 5s between each ticker to avoid hammering Yahoo
            await asyncio.sleep(5)

        await asyncio.sleep(CHECK_INTERVAL_SECONDS)


@router.get("/latest")
async def latest_events(limit: int = 10):
    return _load_events(limit=limit)


@router.post("/{event_id}/dismiss")
async def dismiss_event(event_id: str):
    sb = get_supabase_client()
    if sb:
        try:
            sb.table("price_events").update({"dismissed": True}).eq("id", event_id).execute()
        except Exception:
            pass

    for item in _in_memory_events:
        if item.get("id") == event_id:
            item["dismissed"] = True
            break

    return {"ok": True, "event_id": event_id}


@router.post("/scan-now")
async def scan_now():
    # One-off scan endpoint for manual trigger/testing.
    for symbol in TRACKED:
        price = stock_service.get_stock_price(symbol)
        change_pct = float(price.get("change_percent", 0) or 0)
        if abs(change_pct) >= 3:
            explanation = await _explain_move(symbol, price)
            event = {
                "id": str(uuid.uuid4()),
                "ticker": symbol,
                "change_pct": round(change_pct, 2),
                "direction": "up" if change_pct >= 0 else "down",
                "price": float(price.get("price", 0) or 0),
                "explanation": explanation,
                "dismissed": False,
                "created_at": price.get("timestamp"),
            }
            _save_event(event)
    return {"ok": True, "events": _load_events(limit=10)}
