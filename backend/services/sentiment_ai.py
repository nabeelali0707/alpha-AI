"""
AI Sentiment Analysis Service — Rewritten and conflict-resolved.
Uses HuggingFace FinBERT to analyze financial news headlines.
"""

import logging
from typing import Any, Dict, List

from fastapi import HTTPException

logger = logging.getLogger(__name__)

# ── Lazy-loaded singleton pipeline ──────────────────────────────────────────
_pipeline = None


def _get_pipeline():
    """Lazy-load the FinBERT pipeline once to save memory on import."""
    global _pipeline
    if _pipeline is None:
        try:
            from transformers import pipeline as hf_pipeline

            logger.info("Loading FinBERT model — this may take a moment on first run…")
            _pipeline = hf_pipeline(
                "sentiment-analysis",
                model="ProsusAI/finbert",
                top_k=None,
                truncation=True,
            )
            logger.info("FinBERT model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load FinBERT: {e}. Falling back to default model.")
            from transformers import pipeline as hf_pipeline

            _pipeline = hf_pipeline("sentiment-analysis", truncation=True)
    return _pipeline


def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyze the sentiment of a single piece of text using FinBERT.

    Args:
        text: The financial text/headline to analyze.

    Returns:
        Dict with keys: label, score, and all_scores.
    """
    if not text or not text.strip():
        return {"label": "neutral", "score": 0.0, "all_scores": {}}

    pipe = _get_pipeline()
    results = pipe(text[:512])

    if isinstance(results[0], list):
        scores_list = results[0]
    else:
        scores_list = results

    all_scores = {item["label"].lower(): round(float(item["score"]), 4) for item in scores_list}
    best = max(scores_list, key=lambda x: x["score"])

    return {
        "label": best["label"].lower(),
        "score": round(float(best["score"]), 4),
        "all_scores": all_scores,
    }


class SentimentService:
    """
    High-level service that fetches news and runs FinBERT sentiment on each headline.
    """

    def __init__(self):
        from services.news_service import NewsService

        self.news_service = NewsService()

    async def analyze(self, symbol: str) -> Dict[str, Any]:
        """
        Full sentiment analysis pipeline for a stock ticker.
        """
        try:
            articles = self.news_service.get_stock_news(symbol)

            headline_results: List[Dict[str, Any]] = []
            positive_count = 0
            negative_count = 0
            neutral_count = 0
            total_score = 0.0

            for article in articles:
                headline = article.get("headline", "")
                if not headline:
                    continue

                result = analyze_sentiment(headline)
                mapped_label = result["label"]

                if mapped_label == "positive":
                    positive_count += 1
                    total_score += result["score"]
                elif mapped_label == "negative":
                    negative_count += 1
                    total_score -= result["score"]
                else:
                    neutral_count += 1

                headline_results.append(
                    {
                        "headline": headline,
                        "source": article.get("source", "Unknown"),
                        "url": article.get("url", ""),
                        "published_date": article.get("published_date", ""),
                        "sentiment": {
                            "label": mapped_label,
                            "confidence": result["score"],
                            "all_scores": result["all_scores"],
                        },
                    }
                )

            total = positive_count + negative_count + neutral_count
            if total == 0:
                avg_score = 0.0
                overall_label = "NEUTRAL"
            else:
                avg_score = total_score / total
                if avg_score > 0.15:
                    overall_label = "BULLISH"
                elif avg_score < -0.15:
                    overall_label = "BEARISH"
                else:
                    overall_label = "NEUTRAL"

            return {
                "symbol": symbol.upper(),
                "score": round(avg_score, 4),
                "label": overall_label,
                "total_articles": total,
                "breakdown": {
                    "positive": positive_count,
                    "negative": negative_count,
                    "neutral": neutral_count,
                },
                "headlines": headline_results,
                "indicators": _build_indicators(overall_label, positive_count, negative_count, neutral_count),
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Sentiment analysis failed for {symbol}: {e}")
            raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")


def _build_indicators(label: str, pos: int, neg: int, neu: int) -> List[str]:
    """Build human-readable indicator strings from sentiment counts."""
    indicators = []
    total = pos + neg + neu
    if total == 0:
        return ["No news data available"]

    if pos > neg:
        indicators.append(f"Majority positive sentiment ({pos}/{total} headlines)")
    elif neg > pos:
        indicators.append(f"Majority negative sentiment ({neg}/{total} headlines)")
    else:
        indicators.append(f"Mixed sentiment ({pos} pos / {neg} neg / {neu} neutral)")

    if label == "BULLISH":
        indicators.append("Overall market outlook is bullish")
    elif label == "BEARISH":
        indicators.append("Overall market outlook is bearish")
    else:
        indicators.append("Market outlook is neutral — no strong directional bias")

    return indicators