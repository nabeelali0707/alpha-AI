"""
Optional LLM provider wrapper with deterministic fallbacks.
Supports Groq, Anthropic, and Gemini when keys are configured.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional, Sequence

import httpx

from utils.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self) -> None:
        self.groq_api_key = settings.groq_api_key.strip()
        self.anthropic_api_key = settings.anthropic_api_key.strip()
        self.gemini_api_key = settings.gemini_api_key.strip()

    async def complete(
        self,
        prompt: str,
        *,
        response_format: str = "text",
        max_tokens: int = 700,
        preferred_provider: Optional[str] = None,
    ) -> str:
        providers = self._provider_order(preferred_provider)
        for provider in providers:
            try:
                if provider == "groq" and self.groq_api_key:
                    return await self._complete_groq(prompt, response_format=response_format, max_tokens=max_tokens)
                if provider == "anthropic" and self.anthropic_api_key:
                    return await self._complete_anthropic(prompt, response_format=response_format, max_tokens=max_tokens)
                if provider == "gemini" and self.gemini_api_key:
                    return await self._complete_gemini(prompt, response_format=response_format, max_tokens=max_tokens)
            except Exception as exc:
                logger.warning("%s completion failed: %s", provider.title(), exc)

        return self._fallback(prompt, response_format=response_format)

    @staticmethod
    def _provider_order(preferred_provider: Optional[str]) -> Sequence[str]:
        default_order = ["groq", "anthropic", "gemini"]
        if not preferred_provider:
            return default_order

        provider = preferred_provider.lower().strip()
        if provider not in default_order:
            return default_order

        return [provider, *[item for item in default_order if item != provider]]

    async def _complete_groq(self, prompt: str, *, response_format: str, max_tokens: int) -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.groq_api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "llama-3.1-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": max_tokens,
        }
        if response_format == "json":
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def _complete_anthropic(self, prompt: str, *, response_format: str, max_tokens: int) -> str:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.anthropic_api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        payload: Dict[str, Any] = {
            "model": "claude-3-5-sonnet-20240620",
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}],
        }
        if response_format == "json":
            payload["system"] = "Respond only as valid JSON."

        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            content = data.get("content", [])
            if content and isinstance(content, list):
                return content[0].get("text", "")
            return ""

    async def _complete_gemini(self, prompt: str, *, response_format: str, max_tokens: int) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_api_key}"
        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": max_tokens},
        }
        if response_format == "json":
            payload["generationConfig"]["responseMimeType"] = "application/json"

        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
            return ""

    def _fallback(self, prompt: str, *, response_format: str) -> str:
        if response_format == "json":
            return json.dumps({"fallback": True, "message": prompt[:200]}, ensure_ascii=False)
        return prompt


llm_service = LLMService()
