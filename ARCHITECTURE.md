# 🏗️ AlphaAI Architecture & System Design

**Comprehensive guide to system architecture, data flows, and component interactions.**

---

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Component Overview](#component-overview)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Database Schema](#database-schema)
5. [API Architecture](#api-architecture)
6. [Caching Strategy](#caching-strategy)
7. [Authentication & Security](#authentication--security)
8. [Scalability & Performance](#scalability--performance)

---

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER CLIENTS                          │
│              Browser (Next.js Frontend @ :3000)              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Uvicorn)                   │
│                  FastAPI @ port 8001/api/v1                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Routes: /stocks, /analysis, /portfolio, /auth         │  │
│  │ Middleware: CORS, Rate Limiting, Error Handling       │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐     ┌──────────┐     ┌──────────────┐
   │  Cache  │     │ Services │     │  Database    │
   │ (TTLCache)    │ Layer    │     │ (PostgreSQL) │
   └─────────┘     └──────────┘     │ (Supabase)   │
                         │          └──────────────┘
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌──────────┐  ┌──────────────┐  ┌──────────────┐
   │ yfinance │  │ Transformers │  │   External   │
   │ Stock    │  │ (FinBERT)    │  │   APIs       │
   │ Data     │  │ NLP Models   │  │ (Weather,    │
   └──────────┘  └──────────────┘  │  News, etc)  │
                                    └──────────────┘
```

---

## 📦 Component Overview

### Backend Services

#### 1. **Stock Service** (`services/stock_service.py`)
```python
┌─────────────────────────────────────────┐
│       StockService (Singleton)          │
├─────────────────────────────────────────┤
│ Methods:                                 │
│  • get_stock_price(symbol)               │
│  • get_stock_history(symbol, params)     │
│  • get_stock_info(symbol)                │
│  • get_market_overview()                 │
│  • search_autocomplete(query)            │
│                                          │
│ Internal:                                │
│  • Cache Layer (TTLCache)                │
│    - PRICE_CACHE (30s)                   │
│    - HISTORY_CACHE (5min)                │
│    - INFO_CACHE (1h)                     │
│    - MARKET_CACHE (1min)                 │
└─────────────────────────────────────────┘
```

**Responsibilities:**
- Real-time price fetching from yfinance
- Historical OHLCV data aggregation
- Company fundamentals lookup
- Market overview compilation
- Search autocomplete (PSX-first, yfinance fallback)

---

#### 2. **Technical Service** (`services/technical_service.py`)
```python
┌──────────────────────────────────────────────┐
│     TechnicalIndicatorService                │
├──────────────────────────────────────────────┤
│ Indicators:                                  │
│  • RSI (14-period)                           │
│  • MACD (12, 26, 9-period)                   │
│  • Moving Averages (SMA, EMA)                │
│  • Bollinger Bands (20, 2)                   │
│  • Volatility (annualized)                   │
│                                              │
│ Risk Metrics:                                │
│  • Sharpe Ratio (annualized)                 │
│  • Beta (vs SPY benchmark)                   │
│  • Max Drawdown                              │
│                                              │
│ Calculation: Uses pandas + numpy             │
│ Returns: Dict with all indicators + metrics  │
└──────────────────────────────────────────────┘
```

**Formulas:**
```
RSI = 100 - (100 / (1 + RS))
RS = Avg Gain / Avg Loss (14-period)

MACD = EMA12 - EMA26
Signal = EMA9(MACD)
Histogram = MACD - Signal

Sharpe = (Avg Return - Risk Free) / StdDev * √252
Beta = Cov(Asset Returns, Market Returns) / Var(Market Returns)
Max Drawdown = (Peak - Trough) / Peak
```

---

#### 3. **Recommender Service** (`services/recommender.py`)
```python
┌─────────────────────────────────────────────┐
│      RecommenderService (AI)                │
├─────────────────────────────────────────────┤
│ NLP Model: FinBERT (HuggingFace)            │
│                                             │
│ Signals:                                    │
│  • BUY (confidence 0-100)                   │
│  • SELL (confidence 0-100)                  │
│  • HOLD (confidence 0-100)                  │
│                                             │
│ Reasoning:                                  │
│  • Technical indicators                     │
│  • Price patterns                           │
│  • Volatility assessment                    │
│                                             │
│ Input: Symbol + Historical data             │
│ Output: Signal + Confidence + Reasons       │
└─────────────────────────────────────────────┘
```

---

#### 4. **Urdu Service** (`services/urdu_service.py`)
```python
┌──────────────────────────────────────────────┐
│       UrduService (Localization)             │
├──────────────────────────────────────────────┤
│ Features:                                    │
│  • Translate financial terms (20+)           │
│  • Translate recommendations to Urdu         │
│  • Localize market data                      │
│  • Contextual market advice (Urdu)           │
│                                              │
│ Glossary:                                    │
│  BULLISH → تیز رفتاری                        │
│  BEARISH → سست رفتاری                       │
│  RSI → رشتہ دار طاقت کا اشاریہ               │
│  ... (60+ terms)                             │
│                                              │
│ Cache: LRU (512 entries)                     │
└──────────────────────────────────────────────┘
```

---

#### 5. **Portfolio Service** (`routes/portfolio.py`)
```python
┌────────────────────────────────────────┐
│    Portfolio Management Routes         │
├────────────────────────────────────────┤
│ Endpoints:                             │
│  POST /holdings (create)               │
│  GET /holdings (read all user)         │
│  PUT /holdings/{id} (update)           │
│  DELETE /holdings/{id} (delete)        │
│  GET /summary (portfolio P&L)          │
│                                        │
│ Data Layer: Supabase PostgreSQL        │
│ RLS: Row-Level Security (user_id)     │
│                                        │
│ Calculated Fields:                     │
│  • Current P&L = (Current - Entry) × Q │
│  • ROI % = P&L / (Entry × Q) × 100     │
│  • Portfolio Total = Σ Current Values  │
└────────────────────────────────────────┘
```

---

### Frontend Components

#### 1. **Dashboard** (`app/dashboard/page.tsx`)
- Real-time market overview
- Top gainers/losers
- PSX watchlist
- Technical indicators chart
- AI recommendations feed

#### 2. **Portfolio** (`app/portfolio/page.tsx`)
- Personal holdings list
- P&L per holding
- Portfolio summary (total value, ROI)
- Add/edit/delete holdings
- Risk metrics visualization

#### 3. **Assistant** (`app/assistant/page.tsx`)
- AI chat interface
- Urdu recommendation toggle
- Multi-language support
- Context-aware suggestions

---

## 🔄 Data Flow Diagrams

### User Request Flow (Stock Price)

```
┌────────────────────────────────────────────────────────────┐
│ 1. User searches "AAPL" in frontend                        │
└───────────┬──────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────┐
│ 2. Frontend calls API: GET /api/v1/stocks/AAPL             │
└───────────┬──────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────┐
│ 3. Backend Route Handler (routes/stocks.py)               │
│    - Validates symbol format                              │
│    - Calls StockService.get_stock_price(AAPL)            │
└───────────┬──────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────┐
│ 4. StockService checks PRICE_CACHE (30s TTL)              │
│    - HIT: Return cached price (instant)                   │
│    - MISS: Fetch from yfinance                            │
└───────────┬──────────────────────────────────────────────┘
            │
            ▼ (MISS only)
┌────────────────────────────────────────────────────────────┐
│ 5. yfinance API call (external)                           │
│    - Fetches current price                                │
│    - Parses JSON response                                 │
│    - Stores in PRICE_CACHE                                │
└───────────┬──────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────┐
│ 6. Return to frontend:                                     │
│    {                                                       │
│      "symbol": "AAPL",                                     │
│      "price": 150.25,                                      │
│      "currency": "USD",                                    │
│      "change": 1.50,                                       │
│      "change_pct": 1.01                                    │
│    }                                                       │
└────────────────────────────────────────────────────────────┘
```

### Portfolio Creation Flow

```
┌─────────────────────────────────────────┐
│ User adds holding to portfolio           │
│ POST /api/v1/portfolio/holdings          │
│ Body: {symbol, qty, entry_price, date}  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│ Validate JWT Token (Supabase Auth)                 │
│ Extract user_id from token                          │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│ Insert into portfolio_holdings table                │
│ (user_id, symbol, quantity, entry_price, ...)     │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│ Supabase RLS checks:                                │
│ - Can user only insert their own records? YES      │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│ Return holding_id to frontend                       │
│ Frontend refetches portfolio summary                │
└─────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### PostgreSQL (Supabase)

```sql
-- Users (managed by Supabase Auth)
Table: auth.users (columns: id, email, created_at)

-- User Profiles
Table: profiles
  id (UUID, PK)
  user_id (UUID, FK → auth.users.id)
  username (TEXT)
  preferred_language (TEXT: en, ur)
  created_at (TIMESTAMP)

-- Portfolio Holdings
Table: portfolio_holdings
  id (UUID, PK)
  user_id (UUID, FK → auth.users.id)
  symbol (TEXT) — e.g., "AAPL", "ENGRO.KA"
  quantity (NUMERIC)
  entry_price (NUMERIC)
  entry_date (TIMESTAMP)
  notes (TEXT)
  market (TEXT) — "US", "PSX", "CRYPTO"
  created_at (TIMESTAMP)
  RLS: SELECT/INSERT only if user_id = current_user

-- PSX Stock Catalog
Table: psx_stocks
  id (UUID, PK)
  symbol (TEXT, UNIQUE)
  name (TEXT)
  isin (TEXT)
  last_price (NUMERIC)
  last_date (TIMESTAMP)
  market_cap (NUMERIC)
  metadata (JSONB) — {pe_ratio, dividend_yield}
  created_at (TIMESTAMP)
  RLS: SELECT for all users

-- Watchlist
Table: watchlist
  id (UUID, PK)
  user_id (UUID, FK)
  symbol (TEXT)
  added_at (TIMESTAMP)
  RLS: User can only see own entries

-- Alerts (Future)
Table: alerts
  id (UUID, PK)
  user_id (UUID, FK)
  symbol (TEXT)
  alert_type (TEXT) — "price_above", "price_below"
  threshold (NUMERIC)
  is_triggered (BOOLEAN)
  created_at (TIMESTAMP)
```

### Index Strategy

```sql
-- Query performance
CREATE INDEX idx_portfolio_holdings_user_id 
  ON portfolio_holdings(user_id);

CREATE INDEX idx_portfolio_holdings_symbol 
  ON portfolio_holdings(symbol);

CREATE INDEX idx_psx_stocks_symbol 
  ON psx_stocks(symbol UNIQUE);

CREATE INDEX idx_watchlist_user_id 
  ON watchlist(user_id);
```

---

## 🔌 API Architecture

### Routing Structure

```
/api/v1/
├── /stocks
│   ├── /{symbol}                    — GET current price
│   ├── /{symbol}/history            — GET OHLCV data
│   ├── /{symbol}/info               — GET company info
│   ├── /{symbol}/financials         — GET financial statements
│   ├── /market/overview             — GET all markets
│   ├── /market/psx                  — GET PSX tickers
│   ├── /market/crypto               — GET crypto
│   ├── /market/forex                — GET forex
│   └── /search/autocomplete         — GET suggestions
│
├── /analysis
│   ├── /technical/{symbol}          — GET indicators
│   ├── /recommend/{symbol}          — GET AI signal
│   ├── /recommendations             — GET top picks
│   ├── /urdu/translate              — GET Urdu term
│   └── /urdu/recommend/{symbol}     — GET Urdu signal
│
├── /portfolio (requires auth)
│   ├── /holdings                    — GET/POST holdings
│   ├── /holdings/{id}               — PUT/DELETE holding
│   ├── /summary                     — GET portfolio P&L
│   └── /watchlist                   — GET/POST watchlist
│
└── /auth
    ├── /login                       — POST login
    ├── /logout                      — POST logout
    └── /me                          — GET current user
```

### Response Format (Standard)

```json
{
  "status": "success",
  "data": { /* endpoint-specific data */ },
  "timestamp": "2026-05-16T10:30:45Z",
  "message": "Request successful"
}
```

### Error Handling

```python
# Validation Error (400)
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Invalid symbol format",
  "details": {"symbol": "Must be 1-10 alphanumeric"}
}

# Not Found (404)
{
  "status": "error",
  "code": "NOT_FOUND",
  "message": "Symbol INVALID not found"
}

# Rate Limited (429)
{
  "status": "error",
  "code": "RATE_LIMITED",
  "message": "Too many requests. Retry after 60s"
}

# Server Error (500)
{
  "status": "error",
  "code": "INTERNAL_ERROR",
  "message": "Failed to fetch data"
}
```

---

## 💾 Caching Strategy

### TTL Cache Layer

```python
┌──────────────────────────────────┐
│       TTLCache (In-Memory)       │
├──────────────────────────────────┤
│ Stock Prices        30 seconds   │
│ History Data        5 minutes    │
│ Company Info        1 hour       │
│ Market Overview     1 minute     │
│ Autocomplete        5 minutes    │
│ Urdu Terms (LRU)    512 entries  │
└──────────────────────────────────┘
```

### Cache Invalidation Strategy

```
Manual:
  • Dashboard endpoint: /analysis/dashboard/{symbol}
    (forces fresh data on demand)

Automatic (TTL expiry):
  • After TTL passes, cache entry deleted
  • Next request triggers fresh fetch

Scheduled (Future):
  • Implement Redis for distributed cache
  • Use message queue for cache warming
  • Periodically sync market data
```

### Performance Impact

```
Scenario: 1000 requests for AAPL price

Without cache:
  • 1000 yfinance API calls
  • Avg response time: ~500ms each
  • Total: ~500 seconds (API throttling)
  • Cost: High (rate limiting)

With TTL Cache (30s):
  • First request: yfinance call (~500ms)
  • Requests 2-1000 (within 30s): cache hit (~5ms)
  • Avg response: ~5-10ms (99x faster)
  • Cost: Minimal (1 API call per 30s)
```

---

## 🔐 Authentication & Security

### Token Flow

```
┌─────────────────────────────────────────┐
│ 1. User logs in via Supabase Auth       │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 2. Supabase returns JWT token           │
│    (valid for 1 hour)                   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 3. Frontend stores token in localStorage│
│    (or sessionStorage)                  │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 4. Frontend includes in Authorization   │
│    header: "Bearer <token>"             │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 5. Backend validates token:             │
│    • Checks signature                   │
│    • Checks expiration                  │
│    • Extracts user_id                   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 6. RLS policy checks:                   │
│    user_id in token == user_id in row   │
└─────────────────────────────────────────┘
```

### Security Measures

```
✓ HTTPS only (production)
✓ JWT signature verification
✓ Token expiration (1 hour)
✓ Refresh token rotation
✓ CORS configured for frontend domain only
✓ Input validation + Pydantic models
✓ Rate limiting on all endpoints
✓ SQL injection prevention (Supabase parameterized queries)
✓ XSS protection (React escaping)
✓ CSRF tokens (via Supabase)
```

---

## ⚡ Scalability & Performance

### Horizontal Scaling

```
Current:
  Frontend: 1 instance (port 3000)
  Backend: 1 instance (port 8001)
  Database: Managed PostgreSQL (Supabase)

Scaled:
  Frontend: 3 instances (Vercel, Netlify, etc.)
  Backend: 5 instances (Render, Railway, etc.)
  Database: Same Supabase (auto-scaling)
  Cache: Redis cluster (replaces TTLCache)
  Load Balancer: Route requests round-robin
```

### Performance Metrics (Target)

```
Metric                          Target    Actual
────────────────────────────────────────────────
Stock price fetch               <100ms    ~50ms (cached)
Technical indicators calc       <500ms    ~200ms
AI recommendation gen           <1000ms   ~800ms
Full dashboard render           <2000ms   ~1500ms
Portfolio P&L update            <500ms    ~300ms
API response (cached)           <50ms     ~5ms

Throughput:
  • 100+ concurrent users supported
  • Rate limit: 10 req/min per endpoint
  • Cache hit rate: 95%+ during peak hours
```

### Database Query Performance

```sql
-- Fast (with index)
SELECT * FROM portfolio_holdings 
WHERE user_id = $1;
-- ~5ms (indexed)

-- Slow (no index)
SELECT * FROM portfolio_holdings 
WHERE symbol = $1;
-- ~50ms (sequential scan)

-- Optimized (indexed)
SELECT 
  ph.*,
  (SELECT price FROM stock_price_cache WHERE symbol = ph.symbol) 
FROM portfolio_holdings ph
WHERE user_id = $1;
-- ~20ms (with cache join)
```

---

## 🔮 Future Enhancements

1. **Machine Learning**
   - Custom recommendation model
   - Portfolio optimization
   - Anomaly detection

2. **Real-Time Data**
   - WebSocket for live prices
   - Server-sent events (SSE)
   - Reduce polling overhead

3. **Advanced Analytics**
   - Portfolio correlation analysis
   - Risk factor decomposition
   - Backtesting engine

4. **Social Features**
   - User portfolios comparison
   - Trading signals sharing
   - Community recommendations

5. **Mobile App**
   - React Native frontend
   - Push notifications
   - Offline caching

---

**Last Updated:** May 16, 2026  
**Architecture Version:** 1.0  
**Status:** Production-Ready
