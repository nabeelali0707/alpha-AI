"""
Search Routes — Stock Autocomplete Endpoint
GET /search/{query} — Returns matching tickers/company names for autocomplete.
"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Query

router = APIRouter()
logger = logging.getLogger("alphaai.routes.search")

# ── Curated ticker database (top 150 by market cap / popularity) ─────────────
TICKER_DB: List[Dict[str, str]] = [
    {"symbol": "AAPL",  "name": "Apple Inc.",               "sector": "Technology"},
    {"symbol": "MSFT",  "name": "Microsoft Corporation",    "sector": "Technology"},
    {"symbol": "NVDA",  "name": "NVIDIA Corporation",       "sector": "Technology"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.",            "sector": "Technology"},
    {"symbol": "GOOG",  "name": "Alphabet Inc. (Class C)",  "sector": "Technology"},
    {"symbol": "AMZN",  "name": "Amazon.com Inc.",          "sector": "Consumer Cyclical"},
    {"symbol": "META",  "name": "Meta Platforms Inc.",      "sector": "Technology"},
    {"symbol": "TSLA",  "name": "Tesla Inc.",               "sector": "Consumer Cyclical"},
    {"symbol": "BRK.B", "name": "Berkshire Hathaway Inc.",  "sector": "Financial Services"},
    {"symbol": "LLY",   "name": "Eli Lilly and Company",   "sector": "Healthcare"},
    {"symbol": "AVGO",  "name": "Broadcom Inc.",            "sector": "Technology"},
    {"symbol": "JPM",   "name": "JPMorgan Chase & Co.",     "sector": "Financial Services"},
    {"symbol": "V",     "name": "Visa Inc.",                "sector": "Financial Services"},
    {"symbol": "UNH",   "name": "UnitedHealth Group Inc.",  "sector": "Healthcare"},
    {"symbol": "XOM",   "name": "Exxon Mobil Corporation",  "sector": "Energy"},
    {"symbol": "ORCL",  "name": "Oracle Corporation",       "sector": "Technology"},
    {"symbol": "MA",    "name": "Mastercard Incorporated",  "sector": "Financial Services"},
    {"symbol": "WMT",   "name": "Walmart Inc.",             "sector": "Consumer Defensive"},
    {"symbol": "HD",    "name": "The Home Depot Inc.",      "sector": "Consumer Cyclical"},
    {"symbol": "COST",  "name": "Costco Wholesale Corp.",   "sector": "Consumer Defensive"},
    {"symbol": "NFLX",  "name": "Netflix Inc.",             "sector": "Communication Services"},
    {"symbol": "AMD",   "name": "Advanced Micro Devices",   "sector": "Technology"},
    {"symbol": "ADBE",  "name": "Adobe Inc.",               "sector": "Technology"},
    {"symbol": "CRM",   "name": "Salesforce Inc.",          "sector": "Technology"},
    {"symbol": "PEP",   "name": "PepsiCo Inc.",             "sector": "Consumer Defensive"},
    {"symbol": "KO",    "name": "The Coca-Cola Company",    "sector": "Consumer Defensive"},
    {"symbol": "MCD",   "name": "McDonald's Corporation",   "sector": "Consumer Cyclical"},
    {"symbol": "CSCO",  "name": "Cisco Systems Inc.",       "sector": "Technology"},
    {"symbol": "QCOM",  "name": "QUALCOMM Incorporated",    "sector": "Technology"},
    {"symbol": "TXN",   "name": "Texas Instruments Inc.",   "sector": "Technology"},
    {"symbol": "INTC",  "name": "Intel Corporation",        "sector": "Technology"},
    {"symbol": "IBM",   "name": "International Business Machines", "sector": "Technology"},
    {"symbol": "PYPL",  "name": "PayPal Holdings Inc.",     "sector": "Financial Services"},
    {"symbol": "AMAT",  "name": "Applied Materials Inc.",   "sector": "Technology"},
    {"symbol": "BKNG",  "name": "Booking Holdings Inc.",    "sector": "Consumer Cyclical"},
    {"symbol": "INTU",  "name": "Intuit Inc.",              "sector": "Technology"},
    {"symbol": "HON",   "name": "Honeywell International",  "sector": "Industrials"},
    {"symbol": "AMGN",  "name": "Amgen Inc.",               "sector": "Healthcare"},
    {"symbol": "SBUX",  "name": "Starbucks Corporation",    "sector": "Consumer Cyclical"},
    {"symbol": "GS",    "name": "The Goldman Sachs Group",  "sector": "Financial Services"},
    {"symbol": "MS",    "name": "Morgan Stanley",           "sector": "Financial Services"},
    {"symbol": "BAC",   "name": "Bank of America Corp.",    "sector": "Financial Services"},
    {"symbol": "WFC",   "name": "Wells Fargo & Company",    "sector": "Financial Services"},
    {"symbol": "C",     "name": "Citigroup Inc.",           "sector": "Financial Services"},
    {"symbol": "BLK",   "name": "BlackRock Inc.",           "sector": "Financial Services"},
    {"symbol": "SPGI",  "name": "S&P Global Inc.",          "sector": "Financial Services"},
    {"symbol": "RTX",   "name": "RTX Corporation",          "sector": "Industrials"},
    {"symbol": "CAT",   "name": "Caterpillar Inc.",         "sector": "Industrials"},
    {"symbol": "BA",    "name": "The Boeing Company",       "sector": "Industrials"},
    {"symbol": "GE",    "name": "GE Aerospace",             "sector": "Industrials"},
    {"symbol": "MMM",   "name": "3M Company",               "sector": "Industrials"},
    {"symbol": "DE",    "name": "Deere & Company",          "sector": "Industrials"},
    {"symbol": "UPS",   "name": "United Parcel Service",    "sector": "Industrials"},
    {"symbol": "FDX",   "name": "FedEx Corporation",        "sector": "Industrials"},
    {"symbol": "PFE",   "name": "Pfizer Inc.",              "sector": "Healthcare"},
    {"symbol": "JNJ",   "name": "Johnson & Johnson",        "sector": "Healthcare"},
    {"symbol": "MRK",   "name": "Merck & Co. Inc.",         "sector": "Healthcare"},
    {"symbol": "ABBV",  "name": "AbbVie Inc.",              "sector": "Healthcare"},
    {"symbol": "TMO",   "name": "Thermo Fisher Scientific", "sector": "Healthcare"},
    {"symbol": "ABT",   "name": "Abbott Laboratories",      "sector": "Healthcare"},
    {"symbol": "DHR",   "name": "Danaher Corporation",      "sector": "Healthcare"},
    {"symbol": "CVX",   "name": "Chevron Corporation",      "sector": "Energy"},
    {"symbol": "COP",   "name": "ConocoPhillips",           "sector": "Energy"},
    {"symbol": "SLB",   "name": "Schlumberger Ltd.",        "sector": "Energy"},
    {"symbol": "NEE",   "name": "NextEra Energy Inc.",      "sector": "Utilities"},
    {"symbol": "DUK",   "name": "Duke Energy Corporation",  "sector": "Utilities"},
    {"symbol": "SO",    "name": "The Southern Company",     "sector": "Utilities"},
    {"symbol": "AMT",   "name": "American Tower Corporation", "sector": "Real Estate"},
    {"symbol": "PLD",   "name": "Prologis Inc.",            "sector": "Real Estate"},
    {"symbol": "EQIX",  "name": "Equinix Inc.",             "sector": "Real Estate"},
    {"symbol": "MU",    "name": "Micron Technology Inc.",   "sector": "Technology"},
    {"symbol": "LRCX",  "name": "Lam Research Corporation", "sector": "Technology"},
    {"symbol": "KLAC",  "name": "KLA Corporation",          "sector": "Technology"},
    {"symbol": "MRVL",  "name": "Marvell Technology Inc.",  "sector": "Technology"},
    {"symbol": "FTNT",  "name": "Fortinet Inc.",            "sector": "Technology"},
    {"symbol": "PANW",  "name": "Palo Alto Networks Inc.",  "sector": "Technology"},
    {"symbol": "CRWD",  "name": "CrowdStrike Holdings",     "sector": "Technology"},
    {"symbol": "ZS",    "name": "Zscaler Inc.",             "sector": "Technology"},
    {"symbol": "OKTA",  "name": "Okta Inc.",                "sector": "Technology"},
    {"symbol": "SNOW",  "name": "Snowflake Inc.",           "sector": "Technology"},
    {"symbol": "DDOG",  "name": "Datadog Inc.",             "sector": "Technology"},
    {"symbol": "PLTR",  "name": "Palantir Technologies",    "sector": "Technology"},
    {"symbol": "PATH",  "name": "UiPath Inc.",              "sector": "Technology"},
    {"symbol": "AI",    "name": "C3.ai Inc.",               "sector": "Technology"},
    {"symbol": "COIN",  "name": "Coinbase Global Inc.",     "sector": "Financial Services"},
    {"symbol": "HOOD",  "name": "Robinhood Markets Inc.",   "sector": "Financial Services"},
    {"symbol": "SOFI",  "name": "SoFi Technologies Inc.",   "sector": "Financial Services"},
    {"symbol": "UBER",  "name": "Uber Technologies Inc.",   "sector": "Technology"},
    {"symbol": "LYFT",  "name": "Lyft Inc.",                "sector": "Technology"},
    {"symbol": "ABNB",  "name": "Airbnb Inc.",              "sector": "Consumer Cyclical"},
    {"symbol": "DASH",  "name": "DoorDash Inc.",            "sector": "Consumer Cyclical"},
    {"symbol": "RBLX",  "name": "Roblox Corporation",       "sector": "Communication Services"},
    {"symbol": "U",     "name": "Unity Software Inc.",      "sector": "Technology"},
    {"symbol": "SPOT",  "name": "Spotify Technology S.A.",  "sector": "Communication Services"},
    {"symbol": "DIS",   "name": "The Walt Disney Company",  "sector": "Communication Services"},
    {"symbol": "CMCSA", "name": "Comcast Corporation",      "sector": "Communication Services"},
    {"symbol": "T",     "name": "AT&T Inc.",                "sector": "Communication Services"},
    {"symbol": "VZ",    "name": "Verizon Communications",   "sector": "Communication Services"},
    {"symbol": "TMUS",  "name": "T-Mobile US Inc.",         "sector": "Communication Services"},
    {"symbol": "NKE",   "name": "Nike Inc.",                "sector": "Consumer Cyclical"},
    {"symbol": "LULU",  "name": "Lululemon Athletica",      "sector": "Consumer Cyclical"},
    {"symbol": "TGT",   "name": "Target Corporation",       "sector": "Consumer Defensive"},
    {"symbol": "LOW",   "name": "Lowe's Companies Inc.",    "sector": "Consumer Cyclical"},
    {"symbol": "F",     "name": "Ford Motor Company",       "sector": "Consumer Cyclical"},
    {"symbol": "GM",    "name": "General Motors Company",   "sector": "Consumer Cyclical"},
    {"symbol": "RIVN",  "name": "Rivian Automotive Inc.",   "sector": "Consumer Cyclical"},
    {"symbol": "LCID",  "name": "Lucid Group Inc.",         "sector": "Consumer Cyclical"},
    {"symbol": "NIO",   "name": "NIO Inc.",                 "sector": "Consumer Cyclical"},
    {"symbol": "XPEV",  "name": "XPeng Inc.",               "sector": "Consumer Cyclical"},
    {"symbol": "LI",    "name": "Li Auto Inc.",             "sector": "Consumer Cyclical"},
    {"symbol": "BABA",  "name": "Alibaba Group Holding",    "sector": "Consumer Cyclical"},
    {"symbol": "JD",    "name": "JD.com Inc.",              "sector": "Consumer Cyclical"},
    {"symbol": "PDD",   "name": "PDD Holdings Inc.",        "sector": "Consumer Cyclical"},
    {"symbol": "TSM",   "name": "Taiwan Semiconductor Mfg", "sector": "Technology"},
    {"symbol": "ASML",  "name": "ASML Holding N.V.",        "sector": "Technology"},
    {"symbol": "SAP",   "name": "SAP SE",                   "sector": "Technology"},
    {"symbol": "SHOP",  "name": "Shopify Inc.",             "sector": "Technology"},
    {"symbol": "SQ",    "name": "Block Inc.",               "sector": "Financial Services"},
    {"symbol": "AFRM",  "name": "Affirm Holdings Inc.",     "sector": "Financial Services"},
    {"symbol": "PTON",  "name": "Peloton Interactive Inc.", "sector": "Consumer Cyclical"},
    {"symbol": "ZM",    "name": "Zoom Video Communications", "sector": "Technology"},
    {"symbol": "WORK",  "name": "Slack Technologies",       "sector": "Technology"},
    {"symbol": "TWLO",  "name": "Twilio Inc.",              "sector": "Technology"},
    {"symbol": "NET",   "name": "Cloudflare Inc.",          "sector": "Technology"},
    {"symbol": "TEAM",  "name": "Atlassian Corporation",    "sector": "Technology"},
    {"symbol": "HubS",  "name": "HubSpot Inc.",             "sector": "Technology"},
    {"symbol": "NOW",   "name": "ServiceNow Inc.",          "sector": "Technology"},
    {"symbol": "WDAY",  "name": "Workday Inc.",             "sector": "Technology"},
    {"symbol": "VEEV",  "name": "Veeva Systems Inc.",       "sector": "Healthcare"},
    {"symbol": "MELI",  "name": "MercadoLibre Inc.",        "sector": "Consumer Cyclical"},
    {"symbol": "SE",    "name": "Sea Limited",              "sector": "Consumer Cyclical"},
    {"symbol": "GRAB",  "name": "Grab Holdings Limited",    "sector": "Technology"},
    {"symbol": "SPY",   "name": "SPDR S&P 500 ETF Trust",   "sector": "ETF"},
    {"symbol": "QQQ",   "name": "Invesco QQQ Trust",        "sector": "ETF"},
    {"symbol": "IWM",   "name": "iShares Russell 2000 ETF", "sector": "ETF"},
    {"symbol": "VTI",   "name": "Vanguard Total Stock Market ETF", "sector": "ETF"},
    {"symbol": "BTC-USD","name": "Bitcoin USD",             "sector": "Cryptocurrency"},
    {"symbol": "ETH-USD","name": "Ethereum USD",            "sector": "Cryptocurrency"},
]


def _fuzzy_match(query: str, candidates: List[Dict[str, str]], limit: int = 8) -> List[Dict[str, str]]:
    """Simple fuzzy match on symbol and company name."""
    q = query.strip().upper()
    if not q:
        return []

    exact_symbol = []
    starts_with_symbol = []
    starts_with_name = []
    contains_name = []

    for item in candidates:
        sym = item["symbol"].upper()
        name = item["name"].upper()

        if sym == q:
            exact_symbol.append(item)
        elif sym.startswith(q):
            starts_with_symbol.append(item)
        elif name.startswith(q):
            starts_with_name.append(item)
        elif q in name or q in sym:
            contains_name.append(item)

    results = exact_symbol + starts_with_symbol + starts_with_name + contains_name
    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for r in results:
        if r["symbol"] not in seen:
            seen.add(r["symbol"])
            deduped.append(r)

    return deduped[:limit]


@router.get(
    "/{query}",
    summary="Search stocks by ticker or company name",
    description=(
        "Returns up to 8 matching stock suggestions for the given query. "
        "Matches on ticker symbol prefix first, then company name. "
        "Case-insensitive. Instant response — no external API call."
    ),
    responses={
        200: {"description": "List of matching stocks"},
    },
)
async def search_stocks(
    query: str,
    limit: int = Query(default=8, ge=1, le=20, description="Max suggestions to return"),
) -> List[Dict[str, Any]]:
    """Search for stocks by ticker symbol or company name."""
    results = _fuzzy_match(query, TICKER_DB, limit=limit)

    # Enrich with price if we get ≤ 3 results and query looks like exact ticker
    return [
        {
            "symbol": r["symbol"],
            "name": r["name"],
            "sector": r["sector"],
        }
        for r in results
    ]
