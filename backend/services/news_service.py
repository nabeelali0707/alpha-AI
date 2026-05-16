"""
News Fetching Service — Step 6
Fetches real-time financial news for a given stock ticker using NewsAPI.
"""

import logging
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Any, Dict, List

import requests
from fastapi import HTTPException

from utils.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=128)
def _cached_stock_news(ticker: str, max_articles: int, days_back: int, api_key: str) -> List[Dict[str, Any]]:
    """Cached NewsAPI fetch to reduce repeated external calls for the same ticker."""
    if not api_key or api_key == "your_newsapi_key_here":
        return []

    from_date = (datetime.utcnow() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    to_date = datetime.utcnow().strftime("%Y-%m-%d")

    params = {
        "q": f"{ticker} stock",
        "from": from_date,
        "to": to_date,
        "language": "en",
        "sortBy": "relevancy",
        "pageSize": max_articles,
        "apiKey": api_key,
    }

    response = requests.get(NewsService.BASE_URL, params=params, timeout=10)

    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="NewsAPI key is invalid.")
    if response.status_code == 429:
        return []

    response.raise_for_status()
    data = response.json()

    articles = []
    for article in data.get("articles", []):
        articles.append({
            "headline": article.get("title", ""),
            "source": article.get("source", {}).get("name", "Unknown"),
            "url": article.get("url", ""),
            "published_date": article.get("publishedAt", ""),
            "description": article.get("description", ""),
        })

    return articles


class NewsService:
    """Service to fetch financial news articles from NewsAPI."""

    BASE_URL = "https://newsapi.org/v2/everything"

    def __init__(self):
        self.api_key = settings.newsapi_key

    def get_stock_news(
        self,
        ticker: str,
        max_articles: int = 10,
        days_back: int = 7,
    ) -> List[Dict[str, Any]]:
        """
        Fetch latest financial news articles for a given stock ticker.

        Args:
            ticker: Stock ticker symbol (e.g. "AAPL").
            max_articles: Maximum number of articles to return.
            days_back: How many days back to search.

        Returns:
            List of article dicts with headline, source, url, published_date.
        """
        try:
            return _cached_stock_news(ticker.upper(), max_articles, days_back, self.api_key)

        except HTTPException:
            raise
        except requests.exceptions.Timeout:
            logger.error(f"NewsAPI request timed out for {ticker}")
            return []
        except Exception as e:
            logger.error(f"Failed to fetch news for {ticker}: {e}")
            return []
