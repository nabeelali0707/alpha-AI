"""
Portfolio Management Routes
Handles watchlists, holdings, and P&L calculations
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

# Models
class WatchlistItem(BaseModel):
    symbol: str
    added_at: Optional[datetime] = None

class PortfolioHolding(BaseModel):
    symbol: str
    quantity: float
    entry_price: float
    entry_date: datetime
    current_price: Optional[float] = None
    pnl: Optional[float] = None
    pnl_percent: Optional[float] = None

class PortfolioSummary(BaseModel):
    total_value: float
    total_invested: float
    total_pnl: float
    total_pnl_percent: float
    holdings: List[PortfolioHolding]

class Watchlist(BaseModel):
    user_id: str
    items: List[WatchlistItem]
    updated_at: datetime

# In-memory storage (replace with database in production)
_portfolios = {}
_watchlists = {}

@router.post("/watchlist/add")
async def add_to_watchlist(user_id: str = Query(...), symbol: str = Query(...)):
    """Add symbol to user watchlist"""
    if user_id not in _watchlists:
        _watchlists[user_id] = []
    
    if not any(item.symbol == symbol for item in _watchlists[user_id]):
        _watchlists[user_id].append(WatchlistItem(symbol=symbol, added_at=datetime.now()))
    
    return {"status": "success", "message": f"Added {symbol} to watchlist"}

@router.get("/watchlist", response_model=Watchlist)
async def get_watchlist(user_id: str = Query(...)):
    """Get user watchlist"""
    if user_id not in _watchlists:
        return Watchlist(
            user_id=user_id,
            items=[],
            updated_at=datetime.now()
        )
    
    return Watchlist(
        user_id=user_id,
        items=_watchlists[user_id],
        updated_at=datetime.now()
    )

@router.post("/watchlist/remove")
async def remove_from_watchlist(user_id: str = Query(...), symbol: str = Query(...)):
    """Remove symbol from user watchlist"""
    if user_id in _watchlists:
        _watchlists[user_id] = [
            item for item in _watchlists[user_id] 
            if item.symbol != symbol
        ]
    
    return {"status": "success", "message": f"Removed {symbol} from watchlist"}

@router.post("/holding/add")
async def add_holding(
    user_id: str = Query(...),
    symbol: str = Query(...),
    quantity: float = Query(...),
    entry_price: float = Query(...),
):
    """Add holding to portfolio"""
    if user_id not in _portfolios:
        _portfolios[user_id] = []
    
    # Check if already exists
    for holding in _portfolios[user_id]:
        if holding.symbol == symbol:
            # Update quantity and recalculate average price
            old_value = holding.quantity * holding.entry_price
            new_value = quantity * entry_price
            total_value = old_value + new_value
            total_quantity = holding.quantity + quantity
            holding.entry_price = total_value / total_quantity if total_quantity > 0 else 0
            holding.quantity = total_quantity
            return {"status": "success", "message": f"Updated {symbol} holding"}
    
    _portfolios[user_id].append(
        PortfolioHolding(
            symbol=symbol,
            quantity=quantity,
            entry_price=entry_price,
            entry_date=datetime.now(),
        )
    )
    
    return {"status": "success", "message": f"Added {symbol} holding"}

@router.get("/holdings", response_model=List[PortfolioHolding])
async def get_holdings(user_id: str = Query(...)):
    """Get user portfolio holdings"""
    return _portfolios.get(user_id, [])

@router.get("/summary", response_model=PortfolioSummary)
async def get_portfolio_summary(user_id: str = Query(...)):
    """Get portfolio summary with P&L calculations"""
    holdings = _portfolios.get(user_id, [])
    
    # Calculate totals
    total_invested = sum(h.quantity * h.entry_price for h in holdings)
    # Note: current_price should be fetched from stock service
    total_value = total_invested  # Placeholder
    total_pnl = total_value - total_invested
    total_pnl_percent = (total_pnl / total_invested * 100) if total_invested > 0 else 0
    
    return PortfolioSummary(
        total_value=total_value,
        total_invested=total_invested,
        total_pnl=total_pnl,
        total_pnl_percent=total_pnl_percent,
        holdings=holdings,
    )

@router.post("/holding/remove")
async def remove_holding(user_id: str = Query(...), symbol: str = Query(...)):
    """Remove holding from portfolio"""
    if user_id in _portfolios:
        _portfolios[user_id] = [
            h for h in _portfolios[user_id]
            if h.symbol != symbol
        ]
    
    return {"status": "success", "message": f"Removed {symbol} holding"}
