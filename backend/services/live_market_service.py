"""
Live Market Data Service
Integrates CoinGecko (crypto), ExchangeRate-API (forex), yfinance (stocks)
Provides real-time pricing like TradingView/MT5
"""

import asyncio
import aiohttp
import logging
from typing import Dict, List, Any, Optional
from cachetools import TTLCache
from datetime import datetime
import yfinance as yf

logger = logging.getLogger(__name__)

# ── Request Throttling ─────────────────────────────────────────────────────
# Limit concurrent yfinance requests to prevent connection pool exhaustion
_yfinance_semaphore = asyncio.Semaphore(3)  # Max 3 concurrent requests

async def _throttled_yfinance_call(func, *args, **kwargs):
    """Wrap yfinance calls with a semaphore to throttle requests"""
    async with _yfinance_semaphore:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, func, *args)

# Cache configuration
CRYPTO_CACHE = TTLCache(maxsize=1000, ttl=30)  # 30s for crypto
FOREX_CACHE = TTLCache(maxsize=500, ttl=60)    # 60s for forex
GOLD_CACHE = TTLCache(maxsize=10, ttl=60)      # 60s for gold
METAL_CACHE = TTLCache(maxsize=20, ttl=120)    # 2min for metals

class LiveMarketService:
    """Real-time market data service for all asset classes"""
    
    COINGECKO_API = "https://api.coingecko.com/api/v3"
    EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest"
    
    # Crypto symbols mapped to CoinGecko IDs
    CRYPTO_IDS = {
        "BTC": "bitcoin",
        "ETH": "ethereum",
        "BNB": "binancecoin",
        "SOL": "solana",
        "ADA": "cardano",
        "XRP": "ripple",
        "DOGE": "dogecoin",
        "MATIC": "matic-network",
        "LINK": "chainlink",
        "LTC": "litecoin",
        "BCH": "bitcoin-cash",
        "XLM": "stellar",
        "USDC": "usd-coin",
        "USDT": "tether",
        "DAI": "dai",
        "AVAX": "avalanche-2",
        "ATOM": "cosmos",
        "NEAR": "near",
        "ALGO": "algorand",
        "FLOW": "flow",
    }
    
    # Forex pairs (PKR emphasis for Pakistan)
    FOREX_PAIRS = {
        "USD/PKR": "PKR",
        "EUR/USD": "EUR",
        "GBP/USD": "GBP",
        "JPY/USD": "JPY",
        "CHF/USD": "CHF",
        "AUD/USD": "AUD",
        "CAD/USD": "CAD",
        "INR/USD": "INR",
        "SGD/USD": "SGD",
        "HKD/USD": "HKD",
        "CNY/USD": "CNY",
        "TRY/USD": "TRY",
        "ZAR/USD": "ZAR",
        "BRL/USD": "BRL",
        "MXN/USD": "MXN",
    }
    
    # Precious metals and commodities (via yfinance)
    COMMODITIES = {
        "GC=F": {"name": "Gold", "symbol": "GC=F", "unit": "USD/oz"},
        "SI=F": {"name": "Silver", "symbol": "SI=F", "unit": "USD/oz"},
        "CL=F": {"name": "Crude Oil WTI", "symbol": "CL=F", "unit": "USD/bbl"},
        "NG=F": {"name": "Natural Gas", "symbol": "NG=F", "unit": "USD/MMBtu"},
        "ZW=F": {"name": "Wheat", "symbol": "ZW=F", "unit": "USD/bu"},
        "ZC=F": {"name": "Corn", "symbol": "ZC=F", "unit": "USD/bu"},
        "CC=F": {"name": "Cocoa", "symbol": "CC=F", "unit": "USD/MT"},
        "CT=F": {"name": "Cotton", "symbol": "CT=F", "unit": "USD/lb"},
        "KC=F": {"name": "Coffee", "symbol": "KC=F", "unit": "USD/lb"},
        "SB=F": {"name": "Sugar", "symbol": "SB=F", "unit": "USD/lb"},
    }

    @staticmethod
    async def get_crypto_price(symbol: str, vs_currency: str = "usd") -> Optional[Dict[str, Any]]:
        """Get live cryptocurrency price from CoinGecko (free, no API key)"""
        try:
            cache_key = f"{symbol}_{vs_currency}"
            if cache_key in CRYPTO_CACHE:
                return CRYPTO_CACHE[cache_key]
            
            crypto_id = LiveMarketService.CRYPTO_IDS.get(symbol.upper())
            if not crypto_id:
                logger.warning(f"Unknown crypto symbol: {symbol}")
                return None
            
            async with aiohttp.ClientSession() as session:
                url = f"{LiveMarketService.COINGECKO_API}/simple/price"
                params = {
                    "ids": crypto_id,
                    "vs_currencies": vs_currency,
                    "include_market_cap": "true",
                    "include_24hr_vol": "true",
                    "include_24hr_change": "true",
                    "include_last_updated_at": "true"
                }
                
                async with session.get(url, params=params, timeout=10) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        prices = data.get(crypto_id, {})
                        
                        result = {
                            "symbol": symbol,
                            "price": prices.get(vs_currency, 0),
                            "market_cap": prices.get(f"{vs_currency}_market_cap", 0),
                            "volume_24h": prices.get(f"{vs_currency}_24h_vol", 0),
                            "change_24h": prices.get(f"{vs_currency}_24h_change", 0),
                            "timestamp": datetime.now().isoformat(),
                            "source": "CoinGecko",
                        }
                        
                        CRYPTO_CACHE[cache_key] = result
                        return result
        
        except Exception as e:
            logger.error(f"Error fetching crypto price for {symbol}: {e}")
            return None
    
    @staticmethod
    async def get_forex_rate(pair: str, base: str = "USD") -> Optional[Dict[str, Any]]:
        """Get live forex rates from ExchangeRate-API (free tier with PKR)"""
        try:
            cache_key = pair
            if cache_key in FOREX_CACHE:
                return FOREX_CACHE[cache_key]
            
            # Parse pair (e.g., "USD/PKR" -> target = "PKR")
            parts = pair.split("/")
            if len(parts) != 2:
                return None
            
            base_curr, target_curr = parts[0].upper(), parts[1].upper()
            
            async with aiohttp.ClientSession() as session:
                url = f"{LiveMarketService.EXCHANGE_RATE_API}/{base_curr}"
                
                async with session.get(url, timeout=10) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        rates = data.get("rates", {})
                        rate = rates.get(target_curr, 0)
                        
                        result = {
                            "pair": pair,
                            "base": base_curr,
                            "quote": target_curr,
                            "rate": rate,
                            "timestamp": datetime.now().isoformat(),
                            "source": "ExchangeRate-API",
                        }
                        
                        FOREX_CACHE[cache_key] = result
                        return result
        
        except Exception as e:
            logger.error(f"Error fetching forex rate for {pair}: {e}")
            return None
    
    @staticmethod
    async def get_commodity_price(symbol: str) -> Optional[Dict[str, Any]]:
        """Get commodity prices - disabled due to yfinance rate limiting"""
        # Skip yfinance entirely to prevent rate limit errors
        return None
    
    @staticmethod
    async def get_all_crypto(vs_currency: str = "usd", limit: int = 20) -> List[Dict[str, Any]]:
        """Get top cryptocurrencies with live prices"""
        try:
            cache_key = f"all_crypto_{vs_currency}_{limit}"
            if cache_key in CRYPTO_CACHE:
                return CRYPTO_CACHE[cache_key]
            
            async with aiohttp.ClientSession() as session:
                url = f"{LiveMarketService.COINGECKO_API}/coins/markets"
                params = {
                    "vs_currency": vs_currency,
                    "order": "market_cap_desc",
                    "per_page": limit,
                    "page": 1,
                    "include_market_cap": "true",
                    "include_24hr_vol": "true",
                    "include_24hr_change": "true",
                }
                
                async with session.get(url, params=params, timeout=10) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        
                        cryptos = []
                        for coin in data:
                            cryptos.append({
                                "symbol": coin["symbol"].upper(),
                                "name": coin["name"],
                                "price": coin.get("current_price", 0),
                                "market_cap": coin.get("market_cap", 0),
                                "market_cap_rank": coin.get("market_cap_rank"),
                                "volume_24h": coin.get("total_volume", 0),
                                "change_24h": coin.get("price_change_percentage_24h", 0),
                                "image": coin.get("image", ""),
                                "timestamp": datetime.now().isoformat(),
                            })
                        
                        CRYPTO_CACHE[cache_key] = cryptos
                        return cryptos
        
        except Exception as e:
            logger.error(f"Error fetching all crypto: {e}")
            return []
    
    @staticmethod
    async def get_all_forex() -> List[Dict[str, Any]]:
        """Get all major forex pairs with live rates"""
        try:
            forex_data = []
            
            tasks = []
            for pair in LiveMarketService.FOREX_PAIRS.keys():
                tasks.append(LiveMarketService.get_forex_rate(pair))
            
            results = await asyncio.gather(*tasks)
            
            for result in results:
                if result:
                    forex_data.append(result)
            
            return forex_data
        
        except Exception as e:
            logger.error(f"Error fetching all forex: {e}")
            return []
    
    @staticmethod
    async def get_all_commodities() -> List[Dict[str, Any]]:
        """Get all commodity prices"""
        try:
            commodity_data = []
            
            tasks = []
            for symbol in LiveMarketService.COMMODITIES.keys():
                tasks.append(LiveMarketService.get_commodity_price(symbol))
            
            results = await asyncio.gather(*tasks)
            
            for result in results:
                if result:
                    commodity_data.append(result)
            
            return commodity_data
        
        except Exception as e:
            logger.error(f"Error fetching all commodities: {e}")
            return []
    
    @staticmethod
    async def search_markets(query: str) -> Dict[str, List[Dict[str, Any]]]:
        """Search across all markets (crypto, forex, commodities, stocks)"""
        results = {
            "crypto": [],
            "forex": [],
            "commodities": [],
            "stocks": [],
        }
        
        query = query.upper()
        
        # Search crypto
        for symbol, crypto_id in LiveMarketService.CRYPTO_IDS.items():
            if query in symbol or query in crypto_id.upper():
                price_data = await LiveMarketService.get_crypto_price(symbol)
                if price_data:
                    results["crypto"].append(price_data)
        
        # Search forex
        for pair in LiveMarketService.FOREX_PAIRS.keys():
            if query in pair:
                forex_data = await LiveMarketService.get_forex_rate(pair)
                if forex_data:
                    results["forex"].append(forex_data)
        
        # Search commodities
        for symbol, info in LiveMarketService.COMMODITIES.items():
            if query in symbol or query in info["name"].upper():
                commodity_data = await LiveMarketService.get_commodity_price(symbol)
                if commodity_data:
                    results["commodities"].append(commodity_data)
        
        return results
