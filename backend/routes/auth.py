"""
Auth Routes — /api/v1/auth/
Endpoints:
  GET  /me              — Return current authenticated user + profile
  GET  /protected-test  — Quick auth smoke test
  PUT  /profile         — Update user profile (full_name, avatar_url)
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from utils.auth import get_current_user, get_user_from_supabase
from utils.supabase_client import get_supabase_client

router = APIRouter()
logger = logging.getLogger("alphaai.routes.auth")


# ── Models ──────────────────────────────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get(
    "/me",
    summary="Get current user",
    description="Returns the authenticated user object plus their profile from the database.",
)
async def me(user: dict = Depends(get_current_user)):
    """Return the currently authenticated user with profile data."""
    supabase = get_supabase_client()
    profile = None

    if supabase:
        try:
            result = supabase.table("profiles").select("*").eq("id", user.get("id")).single().execute()
            profile = result.data
        except Exception as exc:
            logger.warning("Failed to fetch profile for user %s: %s", user.get("id"), exc)

    return {
        "user": {
            "id": user.get("id"),
            "email": user.get("email"),
            "created_at": user.get("created_at"),
            "app_metadata": user.get("app_metadata", {}),
            "user_metadata": user.get("user_metadata", {}),
        },
        "profile": profile,
    }


@router.get(
    "/protected-test",
    summary="Auth smoke test",
    description="Returns 200 with user id and email if token is valid, 401 otherwise.",
)
async def protected_test(user: dict = Depends(get_current_user)):
    return {"ok": True, "id": user.get("id"), "email": user.get("email")}


@router.put(
    "/profile",
    summary="Update user profile",
    description="Update the authenticated user's profile fields (full_name, avatar_url).",
)
async def update_profile(
    body: ProfileUpdateRequest,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    user_id = user.get("id")
    updates = {}
    if body.full_name is not None:
        updates["full_name"] = body.full_name.strip()
    if body.avatar_url is not None:
        updates["avatar_url"] = body.avatar_url

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        result = (
            supabase.table("profiles")
            .upsert({"id": user_id, **updates})
            .execute()
        )
        return {"ok": True, "profile": result.data}
    except Exception as exc:
        logger.error("Profile update failed for %s: %s", user_id, exc)
        raise HTTPException(status_code=500, detail="Profile update failed")
