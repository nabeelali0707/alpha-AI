"""
Market briefing and Fear & Greed routes.
"""

from __future__ import annotations

import json
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Query
from openai import AsyncOpenAI

from services.stock_service import StockService
from utils.config import settings

router = APIRouter(prefix="/market", tags=["market"])
stock_service = StockService()


def _language_instruction(language: str) -> str:
    return "Respond fully in Urdu." if language == "ur" else "Respond in English."


@router.get("/briefing")
async def market_briefing(
    language: str = Query(default="en"),
    ticker: Optional[str] = Query(default=None),
):
    if not settings.groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing")

    language = (language or "en").lower()
    if language not in {"en", "ur"}:
        language = "en"

    watch = ["AAPL", "NVDA", "MSFT", "ENGRO.KA", "HBL.KA"]
    if ticker:
        watch.insert(0, ticker.upper())

    snapshot = []
    for symbol in watch[:6]:
        price = stock_service.get_stock_price(symbol)
        snapshot.append(price)

    prompt = (
        "Write exactly 4 concise sentences as a market briefing for investors. "
        "Use this live snapshot and never invent values."
        f"\nSnapshot JSON: {json.dumps(snapshot, ensure_ascii=False)}\n"
        f"{_language_instruction(language)}"
    )

    client = AsyncOpenAI(api_key=settings.groq_api_key, base_url="https://api.groq.com/openai/v1")
    result = await client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": "You are AlphaAI market commentator. Never guarantee profits.",
            },
            {"role": "user", "content": prompt},
        ],
    )

    text = result.choices[0].message.content if result.choices else "Market briefing unavailable."
    return {"briefing": text, "language": language, "snapshot": snapshot}


@router.get("/fear-greed")
async def fear_greed(holdings: Optional[str] = Query(default=None), language: str = Query(default="en")):
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get("https://api.alternative.me/fng/")
        response.raise_for_status()
        payload = response.json()

    rows = payload.get("data", [])
    if not rows:
        raise HTTPException(status_code=502, detail="Fear and Greed source unavailable")

    item = rows[0]
    value = int(item.get("value", 50))
    classification = item.get("value_classification", "Neutral")

    explanation = (
        f"Fear and Greed is {value} ({classification}). "
        "Use disciplined position sizing and avoid emotional entries."
    )

    if settings.groq_api_key:
        try:
            client = AsyncOpenAI(api_key=settings.groq_api_key, base_url="https://api.groq.com/openai/v1")
            prompt = (
                "Write one sentence explaining what this Fear & Greed reading means for portfolio risk. "
                f"Value: {value}, classification: {classification}, holdings: {holdings or 'not provided'}. "
                f"{_language_instruction(language)}"
            )
            result = await client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                temperature=0.2,
                messages=[
                    {"role": "system", "content": "You are AlphaAI risk assistant. Never guarantee profits."},
                    {"role": "user", "content": prompt},
                ],
            )
            if result.choices:
                explanation = result.choices[0].message.content or explanation
        except Exception:
            pass

    return {
        "value": value,
        "classification": classification,
        "timestamp": item.get("timestamp"),
        "explanation": explanation,
    }
