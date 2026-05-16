"""
Portfolio Management Routes
Handles Supabase-backed holdings and P&L calculations
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from models.stock import PortfolioHoldingCreate, PortfolioHoldingResponse, PortfolioSummaryResponse
from services.stock_service import StockService
from utils.auth import get_current_user
from utils.supabase_client import get_supabase_client

router = APIRouter(prefix="/portfolio", tags=["portfolio"])
stock_service = StockService()


def _require_supabase():
    client = get_supabase_client()
    if client is None:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return client


@router.post("/holdings", response_model=PortfolioHoldingResponse)
async def add_holding(payload: PortfolioHoldingCreate, user: dict = Depends(get_current_user)):
    client = _require_supabase()
    user_id = user.get("id")

    entry_date = payload.entry_date or datetime.now().isoformat()
    data = {
        "user_id": user_id,
        "symbol": payload.symbol.upper(),
        "quantity": payload.quantity,
        "entry_price": payload.entry_price,
        "entry_date": entry_date,
        "notes": payload.notes,
        "market": payload.market or "US",
    }

    result = client.table("portfolio_holdings").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to add holding")

    record = result.data[0]
    return PortfolioHoldingResponse(**record)


@router.get("/holdings", response_model=List[PortfolioHoldingResponse])
async def get_holdings(user: dict = Depends(get_current_user)):
    client = _require_supabase()
    user_id = user.get("id")

    result = client.table("portfolio_holdings").select("*").eq("user_id", user_id).execute()
    holdings = result.data or []

    # Fetch current prices in parallel
    priced = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_map = {
            executor.submit(stock_service.get_stock_price, h["symbol"]): h for h in holdings
        }
        for future in as_completed(future_map):
            holding = future_map[future]
            price_data = future.result()
            current_price = float(price_data.get("price") or 0)
            quantity = float(holding.get("quantity") or 0)
            entry_price = float(holding.get("entry_price") or 0)
            pnl = (current_price - entry_price) * quantity
            pnl_percent = (pnl / (entry_price * quantity) * 100) if entry_price and quantity else 0

            priced.append(
                PortfolioHoldingResponse(
                    id=holding["id"],
                    symbol=holding["symbol"],
                    quantity=quantity,
                    entry_price=entry_price,
                    entry_date=str(holding.get("entry_date")),
                    notes=holding.get("notes"),
                    market=holding.get("market"),
                    current_price=round(current_price, 2),
                    pnl=round(pnl, 2),
                    pnl_percent=round(pnl_percent, 2),
                )
            )

    return priced


@router.delete("/holdings/{holding_id}")
async def remove_holding(holding_id: str, user: dict = Depends(get_current_user)):
    client = _require_supabase()
    user_id = user.get("id")

    result = client.table("portfolio_holdings").delete().eq("id", holding_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Holding not found")

    return {"status": "success", "message": "Holding removed"}


@router.get("/summary", response_model=PortfolioSummaryResponse)
async def get_portfolio_summary(user: dict = Depends(get_current_user)):
    holdings = await get_holdings(user)

    total_invested = sum(h.quantity * h.entry_price for h in holdings)
    total_value = sum((h.current_price or 0) * h.quantity for h in holdings)
    total_pnl = total_value - total_invested
    total_pnl_percent = (total_pnl / total_invested * 100) if total_invested > 0 else 0

    return PortfolioSummaryResponse(
        total_value=round(total_value, 2),
        total_invested=round(total_invested, 2),
        total_pnl=round(total_pnl, 2),
        total_pnl_percent=round(total_pnl_percent, 2),
        holdings=holdings,
    )
