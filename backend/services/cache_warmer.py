"""
Background cache warmer — pre-fetches top stocks every 2 minutes.
Keeps popular tickers fast without waiting for user requests.
"""

import asyncio
import logging

from services.recommender import RecommenderService

logger = logging.getLogger(__name__)
TOP_TICKERS = ["AAPL", "NVDA", "MSFT", "TSLA", "GOOGL", "AMZN", "AMD", "META", "PLTR", "ENGRO.KA"]


async def warm_cache():
    recommender = RecommenderService()
    while True:
        for ticker in TOP_TICKERS:
            try:
                await recommender.generate_recommendation(ticker)
                logger.debug(f"Cache warmed: {ticker}")
                await asyncio.sleep(2)
            except Exception as e:
                logger.warning(f"Cache warm failed for {ticker}: {e}")
        await asyncio.sleep(120)