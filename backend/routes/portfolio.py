from fastapi import APIRouter, Depends, HTTPException
from typing import List
from utils.auth import get_current_user
from services.portfolio_service import PortfolioService
from utils.supabase_client import get_supabase_client
from models.portfolio import HoldingCreate, HoldingUpdate, PortfolioSummary, PortfolioHistoryEntry

router = APIRouter()

@router.get("/summary", response_model=PortfolioSummary)
async def get_portfolio_summary(user: dict = Depends(get_current_user)):
    """Get overall portfolio summary and analytics."""
    return PortfolioService.get_portfolio_analytics(user["id"])

@router.get("/holdings")
async def get_portfolio_holdings(user: dict = Depends(get_current_user)):
    """Get list of current holdings."""
    return PortfolioService.get_holdings(user["id"])

@router.post("/holdings")
async def add_holding(holding: HoldingCreate, user: dict = Depends(get_current_user)):
    """Add a new holding to the portfolio."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    try:
        data = {
            "user_id": user["id"],
            "symbol": holding.symbol.upper(),
            "quantity": holding.quantity,
            "entry_price": holding.average_buy_price,
            "company_name": holding.company_name,
            "market": holding.market,
            "notes": holding.notes
        }
        result = supabase.table("portfolio_holdings").insert(data).execute()
        return {"status": "success", "data": result.data[0] if result.data else None}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/holdings/{holding_id}")
async def update_holding(holding_id: str, holding: HoldingUpdate, user: dict = Depends(get_current_user)):
    """Update an existing holding."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    try:
        data = {}
        if holding.quantity is not None: data["quantity"] = holding.quantity
        if holding.average_buy_price is not None: data["entry_price"] = holding.average_buy_price
        if holding.notes is not None: data["notes"] = holding.notes
        
        result = supabase.table("portfolio_holdings").update(data).eq("id", holding_id).eq("user_id", user["id"]).execute()
        return {"status": "success", "data": result.data[0] if result.data else None}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/holdings/{holding_id}")
async def delete_holding(holding_id: str, user: dict = Depends(get_current_user)):
    """Remove a holding from the portfolio."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    try:
        result = supabase.table("portfolio_holdings").delete().eq("id", holding_id).eq("user_id", user["id"]).execute()
        return {"status": "success", "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history", response_model=List[PortfolioHistoryEntry])
async def get_portfolio_history(period: str = "1M", user: dict = Depends(get_current_user)):
    """Get historical portfolio performance data."""
    return PortfolioService.get_portfolio_history(user["id"], period)

@router.get("/analytics")
async def get_detailed_analytics(user: dict = Depends(get_current_user)):
    """Get advanced portfolio analytics."""
    return PortfolioService.get_portfolio_analytics(user["id"])

