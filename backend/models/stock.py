from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class StockPrice(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    timestamp: str

class StockHistoryEntry(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

class StockMetadata(BaseModel):
    symbol: str
    name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[int] = None
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    description: Optional[str] = None
    website: Optional[str] = None
