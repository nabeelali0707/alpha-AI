"""
Prompt builders for AlphaAI's 10 advanced AI features.
Each builder creates a complete LLM prompt from structured data.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional, Sequence


def _time_of_day() -> str:
    hour = datetime.now().hour
    if hour < 12:
        return "morning"
    elif hour < 17:
        return "afternoon"
    else:
        return "evening"


def _today_date() -> str:
    return datetime.now().strftime("%B %d, %Y")


# ── 1. Market Mood Voice Narrator ───────────────────────────────────────────

def build_market_narrator_prompt(
    kse100: str,
    kse_change: str,
    top_gainer: str,
    gainer_pct: str,
    top_loser: str,
    loser_pct: str,
    sentiment_label: str,
    fear_greed_value: str,
    fear_greed_label: str,
    language: str = "en",
) -> str:
    lang_rule = (
        "If language is Urdu, write the entire briefing in natural spoken Urdu — "
        "not translated English, but how a Pakistani news anchor would say it on TV."
        if language == "ur"
        else ""
    )
    return f"""You are AlphaAI's market narrator. Generate a 4-sentence spoken market briefing 
for right now. Write it to be read aloud — no bullet points, no symbols, no 
percentages written as %. Write numbers as words ("up two point three percent").

Data:
- KSE-100: {kse100} ({kse_change})
- Top PSX gainer today: {top_gainer} up {gainer_pct}
- Top PSX loser today: {top_loser} down {loser_pct}
- Overall sentiment: {sentiment_label}
- Fear & Greed: {fear_greed_value} ({fear_greed_label})

Start with: "Good {_time_of_day()}, here is your AlphaAI market briefing for {_today_date()}."
End with one sentence of advice based on overall sentiment.

{lang_rule}
Output plain text only. No formatting whatsoever."""


# ── 2. Explain Candle Pattern ───────────────────────────────────────────────

def build_candle_pattern_prompt(
    ticker: str,
    timeframe: str,
    ohlcv_json: str,
    pattern_name: str,
    language: str = "en",
) -> str:
    lang_rule = "Write in Urdu." if language == "ur" else "Write in the same language the user used."
    return f"""You are a candlestick pattern expert explaining to a beginner investor.

The user is looking at a {timeframe} candlestick chart for {ticker}.
Recent OHLCV data (last 5 candles):
{ohlcv_json}

Current pattern detected: {pattern_name}

Explain in exactly 3 sentences:
1. What this candle pattern is called and what it looks like visually
2. What it historically signals (continuation or reversal, bullish or bearish)
3. What the user should watch for in the NEXT candle to confirm or deny the signal

Use simple words. No jargon. End with one sentence of caution about false signals.
{lang_rule}"""


# ── 3. "What Just Happened?" Event Detection ───────────────────────────────

def build_event_detection_prompt(
    ticker: str,
    price_change_pct: str,
    direction: str,
    open_price: str,
    close_price: str,
    headlines_list: str,
    rsi: str,
    rsi_signal: str,
    volume_ratio: str,
    macd_signal: str,
    language: str = "en",
) -> str:
    lang_rule = "Write in Urdu." if language == "ur" else "Write in the language matching the user's profile setting."
    large_move_warning = (
        '\nAdd at the end: "⚠️ This is an unusually large move — exercise caution."'
        if abs(float(price_change_pct)) > 5
        else ""
    )
    return f"""You are AlphaAI's automatic event analyst.

{ticker} moved {price_change_pct}% today ({direction}: from {open_price} to {close_price}).

Recent headlines (last 24 hours):
{headlines_list}

Current technical state:
- RSI: {rsi} ({rsi_signal})
- Volume vs average: {volume_ratio}x normal volume
- MACD: {macd_signal}

In 2 sentences maximum, explain the most likely reason for this move. 
Be specific — mention the most relevant headline if one exists. 
If no clear news exists, say it appears technical and explain which indicator is driving it.

Format: one plain paragraph, no bullet points.{large_move_warning}
{lang_rule}"""


# ── 4. Personalized Daily Briefing ──────────────────────────────────────────

def build_daily_briefing_prompt(
    watchlist_symbols: str,
    holdings_summary: str,
    date: str,
    minutes_until_open: str,
    stock_data_lines: str,
    pnl_change: str,
    most_important_event: str,
    language: str = "en",
) -> str:
    lang_rule = (
        "If user language is Urdu, write everything in Urdu including numbers written "
        "as Urdu words for amounts over 1 lakh."
        if language == "ur"
        else ""
    )
    return f"""You are writing a personalized morning stock briefing for a specific investor.

Their watchlist: {watchlist_symbols}
Their portfolio holdings: {holdings_summary}
Today's date: {date}
Market opening in: {minutes_until_open} minutes

Stock data for each watchlist item:
{stock_data_lines}

For each watchlist stock, write ONE line in this format:
"TICKER — price — signal — one_reason"

Then add:
"Your portfolio is {{'up' if float(pnl_change) >= 0 else 'down'}} {pnl_change}% from yesterday."
"Today's key event to watch: {most_important_event}"

Keep the entire message under 10 lines total. 
Write like a trusted friend, not a financial robot.
No disclaimers, no legal language — keep it human.

{lang_rule}
Output plain text only. No formatting."""


# ── 5. "Teach Me This Term" ─────────────────────────────────────────────────

def build_term_explainer_prompt(
    term: str,
    ticker: str,
    experience_level: str,
    relevant_indicator_data: str,
    language: str = "en",
) -> str:
    lang_rule = "Write in Urdu." if language == "ur" else "Write in the user's language."
    analogy_rule = (
        "Use an everyday analogy (shopping, cricket, driving — something a Pakistani reader relates to)."
        if experience_level == "beginner"
        else "Skip the analogy, go straight to actionable insight."
    )
    return f"""You are AlphaAI's financial education assistant. The user just clicked on the 
term "{term}" while looking at {ticker}'s analysis.

Their experience level: {experience_level}

Explain "{term}" in exactly 3 sentences:
1. What it means in plain English (no jargon at all)
2. Why it matters for this specific stock right now (use the actual numbers)
3. What a smart investor would do with this information

Current values for context:
{relevant_indicator_data}

For this user: {analogy_rule}

End with: "Want me to explain how to trade this signal?"
{lang_rule}"""


# ── 6. AI Competitor Comparison ─────────────────────────────────────────────

def build_stock_comparison_prompt(
    ticker_a: str,
    price_a: str,
    rsi_a: str,
    signal_a: str,
    sentiment_a: str,
    ma_trend_a: str,
    confidence_a: str,
    ticker_b: str,
    price_b: str,
    rsi_b: str,
    signal_b: str,
    sentiment_b: str,
    ma_trend_b: str,
    confidence_b: str,
    language: str = "en",
) -> str:
    lang_rule = "Write in Urdu." if language == "ur" else "Write in the user's language."
    return f"""You are a stock comparison analyst. Compare these two stocks HEAD TO HEAD 
right now and declare a winner for a medium-term investor (3-6 months).

Stock A: {ticker_a}
- Price: {price_a} | RSI: {rsi_a} | Signal: {signal_a}
- Sentiment: {sentiment_a} | MA Trend: {ma_trend_a}
- Confidence score: {confidence_a}/100

Stock B: {ticker_b}  
- Price: {price_b} | RSI: {rsi_b} | Signal: {signal_b}
- Sentiment: {sentiment_b} | MA Trend: {ma_trend_b}
- Confidence score: {confidence_b}/100

Structure your response EXACTLY like this:
WINNER: TICKER
WHY IN ONE LINE: ...
{ticker_a} STRENGTH: ...
{ticker_b} STRENGTH: ...
RISK TO WATCH: ...

Keep each line under 15 words. No paragraphs.
If both are HOLD, say "Neither — wait for a clearer signal."
{lang_rule}"""


# ── 7. Backtesting Story ───────────────────────────────────────────────────

def build_backtest_story_prompt(
    ticker: str,
    amount: str,
    currency: str,
    start_date: str,
    start_price: str,
    current_price: str,
    shares: str,
    current_value: str,
    return_pct: str,
    major_events_list: str,
    language: str = "en",
) -> str:
    lang_rule = "Write in Urdu." if language == "ur" else "Write in the user's language."
    return f"""You are telling the story of a hypothetical investment to help an investor 
learn from history.

Stock: {ticker}
Hypothetical investment: {amount} {currency} invested on {start_date}
Price on {start_date}: {start_price}
Price today: {current_price}
Shares that would have been bought: {shares}
Current value: {current_value}
Return: {return_pct}%

Key events during this period (from news sentiment shifts):
{major_events_list}

Tell this as a SHORT story in exactly 4 sentences:
1. Set the scene — what was happening in the market when they "bought"
2. The most dramatic moment during the holding period (biggest drop or rise)
3. Where they stand today
4. One lesson this specific journey teaches about this stock

Make it engaging — not dry financial reporting.
Write in first person as if speaking TO the investor.
Use {currency} amounts.
{lang_rule}"""


# ── 8. Entry Timing Analyzer ───────────────────────────────────────────────

def build_entry_timing_prompt(
    ticker: str,
    rsi: str,
    price_vs_sma20: str,
    sma_diff: str,
    vs_52w_high: str,
    vs_52w_low: str,
    volume_ratio: str,
    signal: str,
    confidence: str,
    language: str = "en",
) -> str:
    lang_rule = "Write in Urdu." if language == "ur" else "Write in the user's language."
    return f"""You are an entry timing specialist. The user wants to know if RIGHT NOW is 
a good moment to enter a position in {ticker}, even if the long-term signal is BUY.

Current data:
- RSI: {rsi} — is it high (overbought) or low (oversold) right now?
- Price vs 20-day SMA: {price_vs_sma20} (above/below by {sma_diff}%)
- Price vs 52-week high: {vs_52w_high}% away
- Price vs 52-week low: {vs_52w_low}% away
- Recent volume: {volume_ratio}x average (high volume = conviction)
- Overall signal: {signal} with {confidence}% confidence

Answer ONLY these 3 questions, one sentence each:
1. Is the price at a good entry point or should they wait for a dip?
2. What specific price level would be a better entry if they should wait?
3. What single event or indicator would CONFIRM this is the right moment?

Do not repeat the signal. Do not give generic advice. Be specific with numbers.
{lang_rule}"""


# ── 9. Scam/Pump Detector ──────────────────────────────────────────────────

def build_scam_detector_prompt(
    user_pasted_tip: str,
    ticker: str,
    real_price: str,
    volume_ratio: str,
    rsi: str,
    price_change_7d: str,
    sentiment_label: str,
    article_count: str,
    language: str = "en",
) -> str:
    lang_rule = "Write in Urdu." if language == "ur" else "Write in the user's language."
    return f"""You are AlphaAI's fraud and pump-and-dump detector. A user has received a 
stock tip — your job is to verify it against real data and flag if it looks suspicious.

The tip they received: "{user_pasted_tip}"

Real data for the mentioned stock {ticker}:
- Actual current price: {real_price}
- Volume vs normal: {volume_ratio}x (spike = red flag)
- RSI: {rsi} (above 80 = possibly already pumped)
- Recent price change: {price_change_7d}% in 7 days
- Sentiment from real news: {sentiment_label}
- Number of real news articles: {article_count}

Compare the tip's claims against the real data and give a verdict:

VERDICT: LEGITIMATE / SUSPICIOUS / LIKELY SCAM
CONFIDENCE: low/medium/high
RED FLAGS FOUND: (list only actual discrepancies)
WHAT THE DATA ACTUALLY SHOWS: (1 sentence)
OUR RECOMMENDATION: (1 sentence)

Be direct. If it looks like a pump-and-dump, say so clearly.
{lang_rule}"""


# ── 10. Post-Trade Analyzer ────────────────────────────────────────────────

def build_post_trade_prompt(
    ticker: str,
    buy_price: str,
    buy_date: str,
    sell_price: str,
    sell_date: str,
    profit_loss: str,
    pnl_pct: str,
    days_held: str,
    rsi_at_buy: str,
    signal_at_buy: str,
    sentiment_at_buy: str,
    rsi_at_sell: str,
    signal_at_sell: str,
    sentiment_at_sell: str,
    language: str = "en",
) -> str:
    result_word = "profit" if float(pnl_pct) >= 0 else "loss"
    lang_rule = "Write in Urdu." if language == "ur" else "Write in the user's language."
    return f"""You are a trading coach reviewing a completed trade.

Trade details:
- Stock: {ticker}
- Bought: {buy_price} on {buy_date}
- Sold: {sell_price} on {sell_date}
- Result: {profit_loss} ({pnl_pct}%) — {result_word}
- Holding period: {days_held} days

What the signals were saying at BUY time:
- RSI was: {rsi_at_buy}
- Signal was: {signal_at_buy}
- Sentiment was: {sentiment_at_buy}

What the signals were saying at SELL time:
- RSI was: {rsi_at_sell}
- Signal was: {signal_at_sell}
- News sentiment was: {sentiment_at_sell}

Write a coaching review in 3 short paragraphs:
1. Was the ENTRY good based on signals? What did they get right or wrong?
2. Was the EXIT good? Did they leave money on the table or cut a loss wisely?
3. One specific thing they should do differently next time

Be kind but honest. Use "you" not "the investor."
Never say "you should have" — say "next time, consider."
{lang_rule}"""
