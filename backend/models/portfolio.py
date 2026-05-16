from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class HoldingBase(BaseModel):
    symbol: str
    quantity: float
    average_buy_price: float
    market: Optional[str] = "US"
    company_name: Optional[str] = None
    notes: Optional[str] = None

class HoldingCreate(HoldingBase):
    pass

class HoldingUpdate(BaseModel):
    quantity: Optional[float] = None
    average_buy_price: Optional[float] = None
    notes: Optional[str] = None

class Holding(HoldingBase):
    id: str
    user_id: str
    current_price: Optional[float] = 0.0
    market_value: Optional[float] = 0.0
    gain_loss: Optional[float] = 0.0
    gain_loss_percentage: Optional[float] = 0.0
    daily_change_percentage: Optional[float] = 0.0
    created_at: datetime

class PortfolioAllocation(BaseModel):
    symbol: str
    percentage: float

class PortfolioSummary(BaseModel):
    total_value: float
    total_cost: float
    total_gain_loss: float
    total_gain_loss_percentage: float
    daily_gain_loss: float
    daily_gain_loss_percentage: float
    best_performing_asset: Optional[str] = None
    worst_performing_asset: Optional[str] = None
    allocation: List[PortfolioAllocation]
    holdings: List[Holding]

class PortfolioHistoryEntry(BaseModel):
    portfolio_value: float
    recorded_at: datetime
