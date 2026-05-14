from typing import List, Dict, Any
from services.stock_service import StockService
from services.sentiment_ai import SentimentService

class RecommenderService:
    def __init__(self):
        self.stock_service = StockService()
        # Note: In a real app, you might not want to init SentimentService here 
        # if it loads heavy models every time. Use a singleton or dependency injection.
        self.sentiment_service = None 

    async def get_top_picks(self) -> List[Dict[str, Any]]:
        """
        Generates stock recommendations based on technicals and sentiment.
        """
        # Top tickers to monitor
        tickers = ["NVDA", "AAPL", "MSFT", "TSLA", "AMD"]
        recommendations = []

        for ticker in tickers:
            try:
                # In a real app, you'd combine technical data + sentiment
                # For this placeholder, we'll return structured logic
                
                # Mocking logic based on tickers
                if ticker == "NVDA":
                    action = "BUY"
                    confidence = 0.94
                    reasoning = "Dominant lead in AI infrastructure with record data center growth."
                elif ticker == "TSLA":
                    action = "HOLD"
                    confidence = 0.65
                    reasoning = "Market saturation concerns balanced by autonomous driving potential."
                else:
                    action = "BUY"
                    confidence = 0.85
                    reasoning = "Strong secular growth patterns and resilient cash flow."

                recommendations.append({
                    "symbol": ticker,
                    "action": action,
                    "confidence": confidence,
                    "reasoning": reasoning
                })
            except Exception:
                continue

        return sorted(recommendations, key=lambda x: x['confidence'], reverse=True)
