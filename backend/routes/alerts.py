"""
Price Alert Routes — notify users when stock hits target price.
"""

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from utils.auth import get_current_user
from utils.supabase_client import get_supabase_client

router = APIRouter(prefix="/alerts", tags=["Alerts"])


class AlertCreate(BaseModel):
    symbol: str
    alert_type: str
    threshold: float
    note: Optional[str] = None


@router.post("/")
async def create_alert(alert: AlertCreate, user=Depends(get_current_user)):
    sb = get_supabase_client()
    result = (
        sb.table("alerts")
        .insert(
            {
                "user_id": user["id"],
                "symbol": alert.symbol.upper(),
                "alert_type": alert.alert_type,
                "threshold": alert.threshold,
                "note": alert.note,
                "is_triggered": False,
            }
        )
        .execute()
    )
    return result.data[0]


@router.get("/")
async def get_alerts(user=Depends(get_current_user)):
    sb = get_supabase_client()
    result = sb.table("alerts").select("*").eq("user_id", user["id"]).execute()
    return result.data


@router.delete("/{alert_id}")
async def delete_alert(alert_id: str, user=Depends(get_current_user)):
    sb = get_supabase_client()
    sb.table("alerts").delete().eq("id", alert_id).eq("user_id", user["id"]).execute()
    return {"deleted": True}