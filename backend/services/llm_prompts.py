"""
Prompt builders for AlphaAI LLM flows.
"""

from __future__ import annotations

from typing import Any, Iterable, Sequence


def _is_urdu_text(text: str) -> bool:
    return any("\u0600" <= char <= "\u06ff" for char in text)


def build_stock_chat_prompt(
    ticker: str,
    price: str,
    rsi: str,
    rsi_signal: str,
    macd_signal: str,
    ma_trend: str,
    sentiment_label: str,
    sentiment_score: str,
    total_articles: str,
    recommendation: str,
    confidence: str,
    reasons: Sequence[str],
    question: str,
    language_hint: str,
) -> str:
    reasons_text = "\n".join(f"- {reason}" for reason in reasons) if reasons else "- No reason data available"
    language_rule = "Respond fully in Urdu." if _is_urdu_text(question) or language_hint == "ur" else "Respond in English and offer to switch to Urdu if helpful."
    return f"""You are AlphaAI, an intelligent stock market assistant for Pakistani and global investors.

You have access to the following real-time data for the stock {ticker}:
- Current price: {price}
- RSI: {rsi} ({rsi_signal})
- MACD: {macd_signal}
- Moving average trend: {ma_trend}
- Sentiment: {sentiment_label} (score: {sentiment_score}, based on {total_articles} news articles)
- AI recommendation: {recommendation} with {confidence}% confidence
- Top reasons:
{reasons_text}

The user speaks English or Urdu. {language_rule}

Answer their question directly using the data above. Be concise, honest, and never guarantee profits. If they ask something outside your data (e.g. "compare two stocks"), say you can only analyze one ticker at a time right now.

Never make up prices or news. If data is missing, say so.

User question: {question}"""


def build_portfolio_advisor_prompt(
    holdings_json: str,
    total_value: str,
    total_pnl: str,
    pnl_percent: str,
    top_sector: str,
    question: str,
    language_hint: str,
) -> str:
    language_rule = "Respond in Urdu." if _is_urdu_text(question) or language_hint == "ur" else "Respond in English."
    return f"""You are AlphaAI Portfolio Advisor. The user's current portfolio is:

{holdings_json}

Total value: {total_value} PKR/USD
Total P&L: {total_pnl} ({pnl_percent}%)
Most held sector: {top_sector}

{language_rule}

Answer the user's question about their portfolio. If they ask about risk, check if any single stock is more than 35% of total value and warn them. If they ask what to trim, suggest the highest-loss or most-overbought position. Never guarantee returns. Keep answers under 150 words unless they ask for detail.

User question: {question}"""


def build_news_summary_prompt(ticker: str, headlines: Sequence[str]) -> str:
    items = "\n".join(f"{index + 1}. {headline}" for index, headline in enumerate(headlines[:5]))
    return f"""You are a financial news summarizer for retail investors in Pakistan.

Here are 5 recent headlines for {ticker}:
{items}

For each headline write exactly one sentence explaining what it means for an investor holding this stock. Use plain language, no jargon. Label each as [Bullish], [Bearish], or [Neutral].

Then write a single overall summary sentence starting with: \"Overall, the news for {ticker} is...\"

Respond in JSON format:
{{
  "summaries": [
    {{"headline": "...", "label": "Bullish/Bearish/Neutral", "summary": "..."}},
    ...
  ],
  "overall": "..."
}}"""


def build_urdu_explanation_prompt(
    ticker: str,
    signal: str,
    confidence: str,
    rsi_value: str,
    rsi_signal: str,
    sentiment_label: str,
    ma_trend: str,
    top_reason: str,
) -> str:
    return f"""You are a financial advisor speaking to a Pakistani retail investor in simple Urdu.

Stock: {ticker}
Signal: {signal}
Confidence: {confidence}%
RSI: {rsi_value} - {rsi_signal}
Sentiment: {sentiment_label}
Moving average trend: {ma_trend}
Top reason: {top_reason}

Write a 3-sentence explanation in Urdu (Roman Urdu is also acceptable) that:
1. States the recommendation clearly
2. Explains the single most important reason in simple words
3. Adds a one-line caution about market risk

Do not use English financial jargon. Write like you are explaining to a friend, not a finance professor."""


def build_sector_heatmap_prompt(sector: str, stock_sentiment_list: str) -> str:
    return f"""You are analyzing news sentiment for the {sector} sector.

Here are the sentiment scores for stocks in this sector:
{stock_sentiment_list}

Example format:
- ENGRO.KA: BULLISH (score 0.72, 8 articles)
- LUCK.KA: NEUTRAL (score 0.05, 3 articles)
- FCCL.KA: BEARISH (score -0.41, 5 articles)

Based on these scores, give:
1. An overall sector label: BULLISH / BEARISH / NEUTRAL
2. A single sentence explaining why (max 20 words)
3. A confidence score from 0.0 to 1.0

Respond in JSON only:
{{"label": "BULLISH", "reason": "...", "confidence": 0.74}}"""


def build_earnings_prompt(
    ticker: str,
    days_until: str,
    beat_1: str,
    move_1: str,
    beat_miss_2: str,
    beat_2: str,
    move_2: str,
    beat_miss_3: str,
    beat_3: str,
    move_3: str,
    beat_miss_4: str,
    beat_4: str,
    move_4: str,
    sentiment_label: str,
    recommendation: str,
) -> str:
    return f"""You are a stock market analyst. A user wants to know what to expect before {ticker}'s upcoming earnings report in {days_until} days.

Historical earnings reactions for {ticker}:
- Q1: Beat by {beat_1}% -> stock moved {move_1}%
- Q2: {beat_miss_2} by {beat_2}% -> stock moved {move_2}%
- Q3: {beat_miss_3} by {beat_3}% -> stock moved {move_3}%
- Q4: {beat_miss_4} by {beat_4}% -> stock moved {move_4}%

Current sentiment: {sentiment_label}
Current technical signal: {recommendation}

Write 3 short paragraphs:
1. What the historical pattern suggests
2. What current signals say about this earnings
3. A risk warning (1 sentence)

Keep total response under 120 words. Never predict the exact price."""


def build_pakistan_macro_prompt(
    ticker: str,
    sector: str,
    sbp_rate: str,
    usd_pkr: str,
    inflation: str,
    kse100: str,
    kse_change: str,
    user_language: str,
) -> str:
    language_rule = "Write in Urdu." if user_language == "ur" else "Write in the same language the user used."
    return f"""You are AlphaAI's Pakistan market analyst.

Current macro data:
- SBP Policy Rate: {sbp_rate}%
- USD/PKR: {usd_pkr}
- CPI Inflation: {inflation}%
- KSE-100 today: {kse100} ({kse_change}%)

The user is asking about PSX stock {ticker} in the {sector} sector.

In 2-3 sentences, explain how the current macro environment (especially interest rates and PKR value) affects this specific stock and sector. Use plain language. If the user is in a rate-sensitive sector like banking, highlight the SBP rate specifically. {language_rule}"""


def build_risk_analyzer_prompt(
    holdings_json: str,
    max_weight: str,
    max_stock: str,
    top_sector: str,
    sector_weight: str,
    most_volatile: str,
    beta: str,
    pnl: str,
    language_hint: str,
) -> str:
    language_rule = "Write in Urdu." if language_hint == "ur" else "Write in English."
    return f"""You are a risk advisor for a retail investor.

Their portfolio:
{holdings_json}

Risk metrics:
- Highest single stock weight: {max_weight}% ({max_stock})
- Sector concentration: {top_sector} = {sector_weight}%
- Most volatile holding: {most_volatile} (beta {beta})
- Overall portfolio P&L: {pnl}%

{language_rule}

Answer in 4 bullet points max:
- Is the portfolio over-concentrated? (flag if any single stock > 30% or sector > 50%)
- Which holding carries the most risk right now?
- One specific action to reduce risk
- One positive thing about their current setup

Keep each bullet under 20 words."""
