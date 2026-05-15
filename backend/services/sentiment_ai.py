import torch 
from transformers import pipeline
from typing import Dict, List, Any
from fastapi import HTTPException

from utils.config import settings

class SentimentService:
    def __init__(self):
        # Initialize the sentiment pipeline with the model from settings
        try:
            self.analyzer = pipeline("sentiment-analysis", model=settings.SENTIMENT_MODEL)
        except Exception:
            # Fallback to a standard model if specified model isn't available
            self.analyzer = pipeline("sentiment-analysis")

    async def analyze(self, symbol: str) -> Dict[str, Any]:
        """
        Analyzes market sentiment for a specific ticker using AI.
        In a real scenario, this would scrape news/social media for the symbol.
        """
        try:
            # Simulated text based on current market context (in reality, you'd fetch news)
            sample_texts = [
                f"{symbol} reported stronger than expected earnings this morning.",
                f"Analysts are raising price targets for {symbol} following recent breakthroughs.",
                f"Global supply chain issues might impact {symbol}'s performance in Q3."
            ]
            
            results = self.analyzer(sample_texts)
            
            # Aggregate results
            scores = [res['score'] if res['label'] == 'positive' else -res['score'] for res in results]
            avg_score = sum(scores) / len(scores)
            
            label = "BULLISH" if avg_score > 0.2 else "BEARISH" if avg_score < -0.2 else "NEUTRAL"
            
            return {
                "symbol": symbol.upper(),
                "score": round(float(avg_score), 2),
                "label": label,
                "indicators": [
                    "Strong earnings performance",
                    "Positive analyst sentiment",
                    "Potential supply chain headwinds"
                ]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")
