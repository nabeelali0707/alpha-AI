"""
Urdu Translation & Localization Service
Provides translation to Urdu and financial context localization
"""

import logging
from typing import Dict, Any, Optional
from functools import lru_cache

logger = logging.getLogger("alphaai.urdu_service")

# Pre-defined Urdu translations for common financial terms
URDU_FINANCIAL_GLOSSARY = {
    # Market Status
    "BULLISH": "تیز رفتاری",
    "BEARISH": "سست رفتاری",
    "NEUTRAL": "غیر جانبدارانہ",
    "OVERBOUGHT": "زیادہ خریدی گئی",
    "OVERSOLD": "زیادہ فروخت گئی",
    "BUY": "خریدیں",
    "SELL": "فروخت کریں",
    "HOLD": "روک کر رکھیں",
    
    # Technical Terms
    "GOLDEN_CROSS": "سونے کی تقاطع",
    "DEATH_CROSS": "موت کی تقاطع",
    "RSI": "رشتہ دار طاقت کا اشاریہ",
    "MACD": "چلتی اوسط کنورژنس ڈائیورژنس",
    "VOLATILITY": "بدلتی رہنا",
    "SHARPE_RATIO": "شارپ تناسب",
    "BETA": "بیٹا",
    "DRAWDOWN": "حکمت عملی کا نقصان",
    
    # Market Data
    "MARKET_CAP": "مارکیٹ کی تقدیر",
    "DIVIDEND_YIELD": "ڈیویڈنڈ کی حاصل",
    "PE_RATIO": "قیمت سے آمدنی کا تناسب",
    "52_WEEK_HIGH": "52 ہفتے کی سب سے زیادہ",
    "52_WEEK_LOW": "52 ہفتے کی سب سے کم",
    
    # Risk & Performance
    "RISK": "خطرہ",
    "HIGH_RISK": "اعلیٰ خطرہ",
    "MODERATE_RISK": "معتدل خطرہ",
    "LOW_RISK": "کم خطرہ",
    "GAIN": "منافع",
    "LOSS": "نقصان",
}

# Urdu text for financial advice
URDU_ADVICE_TEMPLATES = {
    "buy_strong": "یہ اسٹاک خریدنے کے لیے ایک اچھی فرصت ہے۔ تکنیکی اشاریہ خریداری کی سفارش دے رہے ہیں۔",
    "sell_strong": "فروخت کرنے پر غور کریں۔ تکنیکی نشانات نیچے کی طرف اشارہ کر رہے ہیں۔",
    "hold": "موجودہ اسٹاک کو روک کر رکھیں۔ مارکیٹ غیر یقینی ہے۔",
    "rsi_overbought": "RSI سطح ظاہر کرتی ہے کہ اسٹاک زیادہ خریدی گئی ہے۔ ستھیر رہیں۔",
    "rsi_oversold": "RSI سطح ظاہر کرتی ہے کہ اسٹاک زیادہ فروخت ہو گئی ہے۔ خریدنے پر غور کریں۔",
    "golden_cross": "سونے کی تقاطع! یہ ایک مضبوط خریداری کا اشارہ ہے۔",
    "death_cross": "موت کی تقاطع! فروخت کرنے پر سنجیدگی سے غور کریں۔",
    "volatility_high": "زیادہ تبدیلی۔ محتاط رہیں اور چھوٹی پوزیشن رکھیں۔",
    "volatility_low": "کم تبدیلی۔ مستحکم اسٹاک ہے۔",
}

class UrduService:
    """Provides Urdu localization and translation services"""
    
    @staticmethod
    @lru_cache(maxsize=512)
    def translate_term(term: str) -> str:
        """Translate a financial term to Urdu using glossary"""
        key = term.upper().replace(" ", "_")
        return URDU_FINANCIAL_GLOSSARY.get(key, term)
    
    @staticmethod
    def translate_recommendation(recommendation: Dict[str, Any]) -> str:
        """
        Generate Urdu text explanation for a stock recommendation
        """
        if not recommendation:
            return "معلومات دستیاب نہیں ہے"
        
        signal = recommendation.get("signal", "HOLD")
        confidence = recommendation.get("confidence", 0)
        reasons = recommendation.get("reasons", {})
        
        # Build Urdu explanation based on signal and reasons
        urdu_text = f"تجویز: {UrduService.translate_term(signal)} (اعتماد: {confidence}%)\n\n"
        
        if signal == "BUY":
            urdu_text += "خریدنے کی سفارش ہے۔ یہاں وجوہات ہیں:\n"
        elif signal == "SELL":
            urdu_text += "فروخت کرنے کی سفارش ہے۔ یہاں وجوہات ہیں:\n"
        else:
            urdu_text += "موجودہ اسٹاک کو روک کر رکھنے کی سفارش ہے۔ یہاں تفصیلات ہیں:\n"
        
        # Add RSI reason
        if reasons.get("rsi_signal"):
            urdu_text += f"• RSI: {UrduService.translate_term(reasons['rsi_signal'])}\n"
        
        # Add Moving Average reason
        if reasons.get("moving_average_trend"):
            urdu_text += f"• چلتی اوسط: {UrduService.translate_term(reasons['moving_average_trend'])}\n"
        
        # Add MACD reason
        if reasons.get("macd_signal"):
            urdu_text += f"• MACD: {UrduService.translate_term(reasons['macd_signal'])}\n"
        
        # Add volatility reason
        if reasons.get("volatility_assessment"):
            urdu_text += f"• تبدیلی: {UrduService.translate_term(reasons['volatility_assessment'])}\n"
        
        return urdu_text
    
    @staticmethod
    def localize_market_data(data: Dict[str, Any], language: str = "urdu") -> Dict[str, Any]:
        """
        Localize market data for Urdu speaking users
        """
        if language != "urdu":
            return data
        
        localized = data.copy()
        
        # Translate key fields if they contain English financial terms
        for key in ["market_status", "signal", "trend", "risk_level"]:
            if key in localized and isinstance(localized[key], str):
                localized[f"{key}_urdu"] = UrduService.translate_term(localized[key])
        
        # Add Urdu descriptions
        if "description" not in localized:
            localized["description_urdu"] = "کوئی تفصیل دستیاب نہیں"
        
        return localized
    
    @staticmethod
    def get_urdu_market_advice(ticker: str, price: float, change_percent: float) -> str:
        """
        Generate simple Urdu market advice based on price movement
        """
        if change_percent > 5:
            return f"{ticker} میں {abs(change_percent):.1f}% اضافہ ہوا ہے۔ فروخت کرنے پر غور کریں۔"
        elif change_percent < -5:
            return f"{ticker} میں {abs(change_percent):.1f}% کمی ہوئی ہے۔ خریدنے پر غور کریں۔"
        else:
            return f"{ticker} میں معمولی تبدیلی ہو رہی ہے۔ موجودہ پوزیشن برقرار رکھیں۔"
