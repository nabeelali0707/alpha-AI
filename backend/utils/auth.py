import os
from typing import Optional, Dict

import httpx
from fastapi import Header, HTTPException

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE") or os.getenv("SUPABASE_ANON_KEY")


async def get_user_from_supabase(token: Optional[str]) -> Dict:
    """Validate an access token by calling Supabase /auth/v1/user.

    Returns user object on success or raises HTTPException.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    url = SUPABASE_URL.rstrip("/") + "/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": SUPABASE_KEY,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, headers=headers)

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return resp.json()


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict:
    """FastAPI dependency to return authenticated user dict.

    Expects header `Authorization: Bearer <token>`
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    try:
        scheme, token = authorization.split()
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    if scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid auth scheme")

    return await get_user_from_supabase(token)
