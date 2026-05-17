import asyncio
import logging
import os
import yfinance as yf
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
from utils.supabase_client import get_supabase_client
from services.llm_service import LLMService

router = APIRouter()
logger = logging.getLogger("alphaai.routes.events")

# Monitored assets
MONITORED_TICKERS = ["AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "ENGRO.KA", "SYS.KA", "LUCK.KA"]

# Keep track of recently logged alerts in-memory to prevent database duplicate floods
_recent_alerts = {}  # {ticker: timestamp}

async def detect_price_events_loop():
    """
    Background worker loop that polls monitored stocks every 5 minutes.
    Detects moves of >= 2.0%, generates AI context, and persists into Supabase.
    """
    logger.info("Initializing background price alerts scanner loop...")
    while True:
        try:
            supabase = get_supabase_client()
            if not supabase:
                logger.warning("Supabase connection not configured. Skipping price alert scan.")
            else:
                for ticker in MONITORED_TICKERS:
                    try:
                        # Stagger yfinance queries slightly
                        await asyncio.sleep(1.0)
                        
                        stock = yf.Ticker(ticker)
                        # Fetch fast info
                        info = stock.fast_info
                        current_price = info.last_price
                        prev_close = info.previous_close
                        
                        if not current_price or not prev_close:
                            # Fallback to history if fast_info is sparse
                            hist = stock.history(period="2d")
                            if len(hist) >= 2:
                                current_price = hist["Close"].iloc[-1]
                                prev_close = hist["Close"].iloc[-2]
                            else:
                                continue

                        change_pct = ((current_price - prev_close) / prev_close) * 100.0
                        
                        if abs(change_pct) >= 2.0:
                            # Check cooldown (1 hour per ticker)
                            now = datetime.now(timezone.utc)
                            if ticker in _recent_alerts:
                                last_alert_time = _recent_alerts[ticker]
                                if now - last_alert_time < timedelta(hours=1):
                                    continue
                            
                            logger.info(f"Signal Alert: {ticker} moved {change_pct:.2f}% to ${current_price:.2f}")
                            
                            # Generate AI rationale for the price move
                            direction = "UP" if change_pct > 0 else "DOWN"
                            system_prompt = "You are the AlphaAI Risk Scanner. Provide a 1-sentence concise explanation for this stock movement."
                            prompt = f"Explain why {ticker} is trading {direction} by {change_pct:.1f}% today at ${current_price:.2f}."
                            explanation = await LLMService.complete(prompt, system_prompt)
                            
                            # Insert into Supabase
                            supabase.table("price_events").insert({
                                "ticker": ticker,
                                "change_pct": round(change_pct, 2),
                                "direction": direction,
                                "price": round(current_price, 2),
                                "explanation": explanation,
                                "dismissed": False
                            }).execute()
                            
                            _recent_alerts[ticker] = now
                            logger.info(f"Saved price event alert for {ticker} into Supabase.")
                            
                    except Exception as err:
                        logger.error(f"Error scanning ticker {ticker}: {err}")
                        
        except Exception as e:
            logger.error(f"Error inside price event loop: {e}")
            
        # Poll every 5 minutes
        await asyncio.sleep(300)

@router.get("/fear-greed", summary="Retrieve current Fear & Greed Index")
async def get_fear_greed_index():
    """
    Computes and returns the dynamic Fear & Greed Index based on monitored market indices.
    """
    try:
        # Standard calculation baseline
        avg_rsi = 50.0
        rsi_vals = []
        
        # Read a couple index proxies
        for ticker in ["^GSPC", "^IXIC"]:
            try:
                stock = yf.Ticker(ticker)
                hist = stock.history(period="14d")
                if len(hist) >= 14:
                    delta = hist["Close"].diff()
                    up = delta.clip(lower=0)
                    down = -1 * delta.clip(upper=0)
                    ema_up = up.ewm(com=13, adjust=False).mean()
                    ema_down = down.ewm(com=13, adjust=False).mean()
                    rs = ema_up / ema_down
                    rsi = 100 - (100 / (1 + rs))
                    rsi_vals.append(rsi.iloc[-1])
            except Exception:
                pass
                
        if rsi_vals:
            avg_rsi = sum(rsi_vals) / len(rsi_vals)
            
        # Map average RSI (typically 30-70) to index range (0-100)
        index_val = int(((avg_rsi - 30) / 40) * 100)
        index_val = max(5, min(95, index_val)) # clamp
    except Exception:
        index_val = 62 # fallback

    classification = "Neutral"
    if index_val <= 20:
        classification = "Extreme Fear"
    elif index_val <= 45:
        classification = "Fear"
    elif index_val <= 55:
        classification = "Neutral"
    elif index_val <= 80:
        classification = "Greed"
    else:
        classification = "Extreme Greed"
        
    explanation = f"Markets are exhibiting signs of '{classification}'. "
    if classification in ["Greed", "Extreme Greed"]:
        explanation += "High relative strength indexes and aggressive buying behavior in tech equities indicate strong bullish continuation."
    elif classification in ["Fear", "Extreme Fear"]:
        explanation += "Recent sector sell-offs and rising defensive hedge holdings indicate flight to safety."
    else:
        explanation += "Trade volume and dynamic moving averages reside within historic corridors without trend anomalies."

    return {
        "value": index_val,
        "classification": classification,
        "explanation": explanation
    }


@router.get("/price-events", summary="List recent price events")
async def list_price_events(limit: int = 6):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(503, "Supabase client is not configured.")

    result = supabase.table("price_events").select("*").eq("dismissed", False).order("created_at", desc=True).limit(limit).execute()
    if result.error:
        logger.error("Failed to fetch price events: %s", result.error)
        raise HTTPException(500, "Unable to load price events.")

    return result.data or []


@router.delete("/price-events/{event_id}", summary="Dismiss a price event")
async def dismiss_price_event(event_id: str):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(503, "Supabase client is not configured.")

    result = supabase.table("price_events").update({"dismissed": True}).eq("id", event_id).execute()
    if result.error:
        logger.error("Failed to dismiss price event %s: %s", event_id, result.error)
        raise HTTPException(500, "Unable to dismiss price event.")

    return {"id": event_id}
