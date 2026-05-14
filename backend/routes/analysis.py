from fastapi import APIRouter
from models.analysis import SentimentResult, Recommendation
from services.sentiment_ai import SentimentService
from services.recommender import RecommenderService

router = APIRouter()
sentiment_service = SentimentService()
recommender_service = RecommenderService()

@router.get("/sentiment/{symbol}", response_model=SentimentResult)
async def analyze_sentiment(symbol: str):
    """Analyze market sentiment for a specific ticker using AI."""
    return await sentiment_service.analyze(symbol)

@router.get("/recommendations", response_model=list[Recommendation])
async def get_recommendations():
    """Get AI-generated stock recommendations based on neural patterns."""
    return await recommender_service.get_top_picks()
