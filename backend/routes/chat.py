"""
LLM Chat Route (SSE)
Provides a streaming conversational endpoint for AlphaAI assistant.
"""

from __future__ import annotations

import asyncio
import json
import re
from typing import Any, AsyncGenerator, Dict, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from services.stock_service import StockService
from services.technical_service import TechnicalService
from utils.config import settings

router = APIRouter(tags=["chat"])

SYSTEM_PROMPT = (
    "You are AlphaAI, an intelligent stock market assistant for Pakistani and "
    "global investors. You have access to real-time stock data provided in this "
    "context. Answer questions directly using the data. Never make up prices. "
    "If data is missing say so. If user writes in Urdu respond fully in Urdu. "
    "Keep answers under 120 words unless detail is requested. Never guarantee profits."
)

TICKER_PATTERN = re.compile(r"\b[A-Z][A-Z0-9.-]{0,11}\b")
URDU_PATTERN = re.compile(r"[\u0600-\u06FF]")


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    ticker: Optional[str] = None
    language: str = Field(default="en")


class CompareRequest(BaseModel):
    ticker_a: str
    ticker_b: str
    language: str = "en"


class ScamCheckRequest(BaseModel):
    tip_text: str = Field(min_length=1)
    language: str = "en"


class TermExplainRequest(BaseModel):
    term: str = Field(min_length=1)
    ticker: Optional[str] = None
    language: str = "en"


class ChatRouteService:
    def __init__(self) -> None:
        self.stock_service = StockService()
        self.technical_service = TechnicalService()

    @staticmethod
    def detect_ticker(message: str, explicit_ticker: Optional[str]) -> Optional[str]:
        if explicit_ticker and explicit_ticker.strip():
            return explicit_ticker.strip().upper()

        candidates = TICKER_PATTERN.findall(message.upper())
        if not candidates:
            return None

        ignored = {
            "THE",
            "WHAT",
            "WITH",
            "FROM",
            "THIS",
            "THAT",
            "MARKET",
            "STOCK",
            "PRICE",
            "BUY",
            "SELL",
            "HOLD",
        }
        for token in candidates:
            if token not in ignored:
                return token
        return None

    async def build_context(self, ticker: Optional[str]) -> Dict[str, Any]:
        context: Dict[str, Any] = {"ticker": ticker, "stock": None, "technical": None}
        if not ticker:
            return context

        stock_task = asyncio.to_thread(self.stock_service.get_stock_price, ticker)
        technical_task = asyncio.to_thread(self.technical_service.get_all_indicators, ticker)

        stock_data, technical_data = await asyncio.gather(stock_task, technical_task, return_exceptions=True)

        if not isinstance(stock_data, Exception):
            context["stock"] = stock_data

        if not isinstance(technical_data, Exception):
            context["technical"] = technical_data

        return context


chat_service = ChatRouteService()


def sse_payload(data: Dict[str, Any]) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/chat")
async def chat(payload: ChatRequest):
    if not settings.groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing in backend environment")

    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    ticker = chat_service.detect_ticker(message, payload.ticker)
    language = payload.language.lower().strip()
    if language not in {"en", "ur"}:
        language = "en"

    context = await chat_service.build_context(ticker)

    detected_urdu = bool(URDU_PATTERN.search(message))
    user_language = "ur" if language == "ur" or detected_urdu else "en"

    language_instruction = "Respond fully in Urdu." if user_language == "ur" else "Respond in English."

    context_blob = json.dumps(context, ensure_ascii=False)
    user_prompt = (
        f"User message: {message}\n"
        f"Language preference: {user_language}\n"
        f"Live data context JSON: {context_blob}\n"
        f"{language_instruction}"
    )

    client = AsyncOpenAI(api_key=settings.groq_api_key, base_url="https://api.groq.com/openai/v1")

    async def event_stream() -> AsyncGenerator[str, None]:
        yield sse_payload({"type": "thought", "message": "Received user message"})
        if ticker:
            yield sse_payload({"type": "thought", "message": f"Detected ticker: {ticker}"})
        else:
            yield sse_payload({"type": "thought", "message": "No ticker detected in message"})

        if context.get("stock"):
            yield sse_payload({"type": "thought", "message": "Fetched live stock price context"})
        else:
            yield sse_payload({"type": "thought", "message": "Stock price context unavailable"})

        if context.get("technical"):
            yield sse_payload({"type": "thought", "message": "Fetched technical indicator context"})
        else:
            yield sse_payload({"type": "thought", "message": "Technical context unavailable"})

        yield sse_payload({"type": "thought", "message": "Querying Groq LLM"})

        try:
            stream = await client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                temperature=0.2,
                stream=True,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
            )

            async for chunk in stream:
                delta = chunk.choices[0].delta.content if chunk.choices else None
                if not delta:
                    continue

                for word in delta.split(" "):
                    if word:
                        yield sse_payload({"type": "token", "token": f"{word} "})

            yield sse_payload({"type": "done"})
        except Exception as exc:
            yield sse_payload({"type": "error", "message": str(exc)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/chat/compare")
async def compare(payload: CompareRequest):
    if not settings.groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing in backend environment")

    ticker_a = payload.ticker_a.upper().strip()
    ticker_b = payload.ticker_b.upper().strip()

    stock_a_task = asyncio.to_thread(chat_service.stock_service.get_stock_price, ticker_a)
    stock_b_task = asyncio.to_thread(chat_service.stock_service.get_stock_price, ticker_b)
    tech_a_task = asyncio.to_thread(chat_service.technical_service.get_all_indicators, ticker_a)
    tech_b_task = asyncio.to_thread(chat_service.technical_service.get_all_indicators, ticker_b)

    stock_a, stock_b, tech_a, tech_b = await asyncio.gather(stock_a_task, stock_b_task, tech_a_task, tech_b_task)

    client = AsyncOpenAI(api_key=settings.groq_api_key, base_url="https://api.groq.com/openai/v1")
    prompt = (
        "Compare these two stocks and declare one winner for current setup. "
        "Return compact JSON with keys: winner, confidence, summary, left_reasons, right_reasons. "
        f"Ticker A ({ticker_a}) data: {json.dumps({'price': stock_a, 'technical': tech_a}, ensure_ascii=False)}\n"
        f"Ticker B ({ticker_b}) data: {json.dumps({'price': stock_b, 'technical': tech_b}, ensure_ascii=False)}"
    )
    result = await client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are AlphaAI comparison analyst. Never guarantee profits."},
            {"role": "user", "content": prompt},
        ],
    )

    raw = result.choices[0].message.content if result.choices else "{}"
    parsed = json.loads(raw or "{}")

    return {
        "ticker_a": ticker_a,
        "ticker_b": ticker_b,
        "left": {"ticker": ticker_a, "price": stock_a, "technical": tech_a},
        "right": {"ticker": ticker_b, "price": stock_b, "technical": tech_b},
        "analysis": parsed,
    }


@router.post("/chat/scam-check")
async def scam_check(payload: ScamCheckRequest):
    if not settings.groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing in backend environment")

    ticker = chat_service.detect_ticker(payload.tip_text, None)
    stock = chat_service.stock_service.get_stock_price(ticker) if ticker else None
    technical = chat_service.technical_service.get_all_indicators(ticker) if ticker else None

    client = AsyncOpenAI(api_key=settings.groq_api_key, base_url="https://api.groq.com/openai/v1")
    prompt = (
        "You are a stock scam detector. Analyze this tip and produce compact JSON with keys: "
        "verdict (LEGITIMATE|SUSPICIOUS|LIKELY SCAM), red_flags (array), actual_data (string). "
        f"Tip text: {payload.tip_text}\n"
        f"Detected ticker: {ticker}\n"
        f"Live stock data: {json.dumps(stock, ensure_ascii=False)}\n"
        f"Technical data: {json.dumps(technical, ensure_ascii=False)}"
    )
    result = await client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are AlphaAI anti-fraud analyst. Never guarantee profits."},
            {"role": "user", "content": prompt},
        ],
    )

    raw = result.choices[0].message.content if result.choices else "{}"
    parsed = json.loads(raw or "{}")
    return {
        "ticker": ticker,
        "tip": payload.tip_text,
        "verdict": parsed.get("verdict", "SUSPICIOUS"),
        "red_flags": parsed.get("red_flags", []),
        "actual_data": parsed.get("actual_data", "Data unavailable"),
    }


@router.post("/chat/term")
async def explain_term(payload: TermExplainRequest):
    if not settings.groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing in backend environment")

    language = payload.language.lower().strip()
    if language not in {"en", "ur"}:
        language = "en"

    client = AsyncOpenAI(api_key=settings.groq_api_key, base_url="https://api.groq.com/openai/v1")
    prompt = (
        "Explain this stock/technical term in exactly 3 sentences for a beginner. "
        "Include one Pakistani everyday analogy (cricket, shopping, or driving). "
        f"Term: {payload.term}; Ticker context: {payload.ticker or 'N/A'}."
    )
    if language == "ur":
        prompt += " Respond fully in Urdu."

    result = await client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        temperature=0.2,
        messages=[
            {"role": "system", "content": "You are AlphaAI teacher assistant."},
            {"role": "user", "content": prompt},
        ],
    )

    text = result.choices[0].message.content if result.choices else "Explanation unavailable."
    return {"term": payload.term, "ticker": payload.ticker, "explanation": text}
