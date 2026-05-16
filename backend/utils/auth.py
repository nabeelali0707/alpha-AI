"""
Auth Utility — JWT validation via Supabase REST API.
Supports both required and optional auth dependencies.
"""

import logging
from typing import Dict, Optional

import httpx
from fastapi import Header, HTTPException

from utils.config import settings

logger = logging.getLogger("alphaai.utils.auth")


def _get_supabase_credentials() -> tuple[str, str]:
    """Return (supabase_url, api_key) from settings, raising 500 if missing."""
    url = settings.supabase_url
    key = settings.supabase_service_role or settings.supabase_anon_key

    if not url or not key:
        logger.error("Supabase credentials not configured in environment")
        raise HTTPException(
            status_code=500,
            detail="Authentication service is not configured. Contact the administrator."
        )
    return url, key


async def get_user_from_supabase(token: Optional[str]) -> Dict:
    """Validate an access token by calling Supabase /auth/v1/user.

    Returns user dict on success or raises HTTPException.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    url, key = _get_supabase_credentials()
    endpoint = url.rstrip("/") + "/auth/v1/user"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                endpoint,
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": key,
                },
            )
    except httpx.RequestError as exc:
        logger.error("Supabase auth request failed: %s", exc)
        raise HTTPException(status_code=503, detail="Authentication service unavailable")

    if resp.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if resp.status_code != 200:
        logger.warning("Supabase auth returned %s: %s", resp.status_code, resp.text)
        raise HTTPException(status_code=401, detail="Token validation failed")

    return resp.json()


async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> Dict:
    """FastAPI dependency — required auth. Returns authenticated user dict.

    Expects header: ``Authorization: Bearer <token>``
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header"
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Authorization header must be: Bearer <token>"
        )

    return await get_user_from_supabase(parts[1])


async def get_optional_user(
    authorization: Optional[str] = Header(None)
) -> Optional[Dict]:
    """FastAPI dependency — optional auth. Returns user dict or None (no 401)."""
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None
