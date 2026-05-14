from pydantic import BaseModel
from typing import List

class SentimentResult(BaseModel):
    symbol: str
    score: float  # -1.0 to 1.0
    label: str    # BULLISH, BEARISH, NEUTRAL
    indicators: List[str]

class Recommendation(BaseModel):
    symbol: str
    action: str   # BUY, SELL, HOLD
    confidence: float
    reasoning: str
