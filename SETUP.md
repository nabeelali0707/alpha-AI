# AlphaAI — Complete Setup & Deployment Guide

**Version:** 1.0 | **Date:** May 2026 | **Status:** Production-Ready MVP

---

## 📋 Table of Contents
1. [Quick Start (Local Dev)](#quick-start-local-dev)
2. [Environment Setup](#environment-setup)
3. [Database Schema & Migration](#database-schema--migration)
4. [Docker Deployment](#docker-deployment)
5. [API Endpoints](#api-endpoints)
6. [PSX Integration & Data Ingestion](#psx-integration--data-ingestion)
7. [Urdu Localization Features](#urdu-localization-features)
8. [Risk Metrics & Portfolio Analytics](#risk-metrics--portfolio-analytics)
9. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- **Python 3.11+** (backend)
- **Node.js 18+** (frontend)
- **Git** (version control)

### Step 1: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Key Dependencies:**
- `fastapi==0.111.0` — Web framework
- `yfinance==0.2.40` — Stock data API
- `supabase==2.6.0` — Database & auth client
- `slowapi==0.1.9` — Rate limiting
- `cachetools==5.5.0` — Caching layer
- `deep-translator==1.11.4` — Urdu translations
- `pandas` & `numpy` — Data processing

### Step 2: Start Backend Server

```bash
cd backend
uvicorn main:app --reload --port 8001
```

Server starts at: **http://localhost:8001**

Swagger docs available at: **http://localhost:8001/docs**

### Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 4: Start Frontend Dev Server

```bash
cd frontend
npm run dev
```

Frontend accessible at: **http://localhost:3000**

---

## ⚙️ Environment Setup

### Backend (.env)

Create `backend/.env` with these variables:

```bash
# Supabase (optional for local dev)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Server config (optional)
BACKEND_PORT=8001
LOG_LEVEL=INFO
```

### Frontend (.env.local)

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_ALPHAAI_API_BASE_URL=http://localhost:8001/api/v1
```

**Production URLs:**
```bash
# If deployed, use absolute URLs:
NEXT_PUBLIC_ALPHAAI_API_BASE_URL=https://api.alphaai.app/api/v1
```

---

## 🗄️ Database Schema & Migration

### Apply PostgreSQL Schema

If using **Supabase** (recommended):

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy all SQL from `supabase/tables.sql`
3. Run the script

**Tables Created:**
- `public.profiles` — User profiles (linked to auth)
- `public.portfolio_holdings` — User stock holdings
- `public.watchlist` — Favorite symbols per user
- `public.psx_stocks` — PSX stock catalog (for autocomplete)
- `public.alerts` — Price alerts (future feature)

### Verify Schema

```sql
\dt public.*
```

Should show all 6 tables.

---

## 🐳 Docker Deployment

### Build & Run Full Stack

```bash
# From repo root
docker-compose up --build
```

**Services:**
- **db** (PostgreSQL 15) — Port 5432
- **backend** (FastAPI) — Port 8001
- **frontend** (Next.js) — Port 3000

**What Happens:**
1. Docker builds images
2. Postgres starts and waits for connections
3. Backend entrypoint applies `supabase/tables.sql` schema
4. Backend starts on 8001
5. Frontend starts on 3000 (connects to backend via service name `backend:8001`)

### Run Only Backend

```bash
docker-compose up backend -d
```

### Tear Down

```bash
docker-compose down -v  # -v removes volumes
```

---

## 📡 API Endpoints

### Health & Status

```
GET /api/v1/
```

Returns app metadata and version.

### Stock Data (Real-Time & Historical)

```
GET /api/v1/stocks/{symbol}
  Returns: Current price, 24h change, % change

GET /api/v1/stocks/{symbol}/history?period=1mo&interval=1d
  Returns: OHLCV data (Open, High, Low, Close, Volume)

GET /api/v1/stocks/{symbol}/info
  Returns: Company metadata (name, sector, market cap, P/E, dividend yield)

GET /api/v1/stocks/{symbol}/financials
  Returns: Income statement, balance sheet, cash flow

GET /api/v1/stocks/{symbol}/actions
  Returns: Historical dividends and stock splits
```

### Technical Indicators

```
GET /api/v1/analysis/technical/{symbol}
  Returns: RSI, MACD, Moving Averages, Volatility, Bollinger Bands
  Plus: Sharpe Ratio, Beta, Max Drawdown
```

### AI Recommendations

```
GET /api/v1/analysis/recommend/{symbol}
  Returns: BUY/SELL/HOLD signal, confidence %, reasons, technical summary

GET /api/v1/analysis/recommendations
  Returns: Top picks across monitored tickers
```

### Market Overview

```
GET /api/v1/stocks/market/overview
  Returns: All markets grouped (PSX, US, Crypto, Forex, Commodities, Indices)

GET /api/v1/stocks/market/psx
  Returns: Pakistani stock listing

GET /api/v1/stocks/market/crypto
  Returns: Top cryptocurrencies

GET /api/v1/stocks/market/forex
  Returns: Major forex pairs
```

### Autocomplete & Search

```
GET /api/v1/stocks/search/autocomplete?q=AP&limit=10
  Returns: Matching symbols (PSX first, then yfinance fallback)
```

### Urdu Localization

```
GET /api/v1/analysis/urdu/translate?term=BULLISH
  Returns: Urdu translation (تیز رفتاری)

GET /api/v1/analysis/urdu/recommend/{symbol}
  Returns: Recommendation with Urdu explanation
```

### Portfolio Management (requires Supabase auth)

```
POST /api/v1/portfolio/holdings
  Body: { symbol, quantity, entry_price, entry_date, notes, market }
  Returns: Created holding record

GET /api/v1/portfolio/holdings
  Returns: All holdings for authenticated user with P&L

DELETE /api/v1/portfolio/holdings/{holding_id}
  Returns: Deletion confirmation

GET /api/v1/portfolio/summary
  Returns: Total invested, current value, total P&L, % return
```

---

## 🇵🇰 PSX Integration & Data Ingestion

### PSX Market Tickers

The system includes 15 major PSX companies:
- **ENGRO.KA** (Engro Corporation)
- **HBL.KA** (Habib Bank Limited)
- **MCB.KA** (MCB Bank)
- **OGDC.KA** (Oil & Gas Development Company)
- **PPL.KA** (Pakistan Petroleum Limited)
- ... and 10 more

### Ingest PSX CSV Data

**Prepare CSV files** with format:
```
symbol,name,last_price,last_date,market_cap
ENGRO.KA,Engro Corporation,100.50,2026-05-16,5000000000
HBL.KA,Habib Bank Limited,95.25,2026-05-16,3500000000
```

**Place in:** `backend/psx_data/`

**Run ingestion:**
```bash
cd backend
python scripts/psx_ingest.py
```

**Verify in DB:**
```sql
SELECT COUNT(*) FROM public.psx_stocks;
```

---

## 🌐 Urdu Localization Features

### Urdu Financial Glossary

The system translates 20+ financial terms automatically:
- BULLISH → تیز رفتاری
- BEARISH → سست رفتاری
- RSI → رشتہ دار طاقت کا اشاریہ
- MACD → چلتی اوسط کنورژنس ڈائیورژنس
- And more...

### Urdu Recommendation Endpoint

```
GET /api/v1/analysis/urdu/recommend/AAPL

Response:
{
  "symbol": "AAPL",
  "signal": "BUY",
  "confidence": 78,
  "urdu_explanation": "خریدنے کی سفارش ہے۔ یہاں وجوہات ہیں:\n• RSI: غیر جانبدارانہ\n• چلتی اوسط: سونے کی تقاطع\n..."
}
```

### Frontend Urdu Toggle

The AI Recommendation Card includes an "Urdu" button that:
- Fetches Urdu explanation from backend
- Displays alongside English analysis
- Improves accessibility for Pakistani users

---

## 📊 Risk Metrics & Portfolio Analytics

### Calculated Risk Metrics

**Per-holding P&L:**
- Current Price (real-time)
- Entry Price (purchase cost)
- Quantity
- Profit/Loss in PKR/USD
- Return %

**Portfolio Summary:**
- Total Invested
- Current Portfolio Value
- Total P&L
- Total Return %

### Advanced Risk Indicators

**Technical-based metrics** (calculated daily):
- **Sharpe Ratio:** Risk-adjusted returns (annualized)
- **Beta:** Volatility vs. S&P 500 benchmark
- **Max Drawdown:** Historical downside exposure

**Example calculation:**
```python
# Sharpe Ratio = (Avg Return - Risk-Free Rate) / Std Dev
# Beta = Cov(Stock Returns, Market Returns) / Var(Market Returns)
```

---

## 🔍 Troubleshooting

### Backend Issues

**"Module not found" errors**
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

**Port 8001 already in use**
```bash
# Windows: Find and kill process on port 8001
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :8001
kill -9 <PID>
```

**yfinance timeout**
- The system retries automatically with fallback periods
- Check your internet connection
- yfinance may throttle requests — use rate limiting

### Frontend Issues

**"Cannot find module" errors**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**API calls fail with 404**
- Verify `.env.local` has correct `NEXT_PUBLIC_ALPHAAI_API_BASE_URL`
- Check backend is running (`http://localhost:8001`)
- Check browser console for CORS errors

**Slow page loads**
- Technical indicators cache for 5 minutes (reduce API calls)
- Historical data caches for 300 seconds
- Portfolio data is only fetched on login

### Database Issues

**Supabase connection refused**
- Check `SUPABASE_URL` and keys in `.env`
- Verify Supabase project is active
- Test connection: `curl https://your-project.supabase.co/rest/v1`

**Portfolio tables don't exist**
- Run SQL schema again from `supabase/tables.sql`
- Check user has proper permissions

---

## 📈 Performance & Scaling

### Caching Strategy

| Data | Cache TTL | Purpose |
|------|-----------|---------|
| Stock Price | 30 seconds | Real-time with minimal API calls |
| Historical | 5 minutes | Chart rendering |
| Company Info | 1 hour | Metadata (sector, market cap) |
| Market Overview | 1 minute | Dashboard market trends |
| Autocomplete | 5 minutes | Search suggestions |

### Rate Limiting

- Dashboard endpoint: **10 requests/minute**
- Technical indicators: **30 requests/minute**
- Stock info: **60 requests/minute**

Configured via `slowapi` and `backend/utils/limiter.py`.

### Scalability Notes

**To scale horizontally:**
1. Deploy backend on Render/Railway/AWS with auto-scaling
2. Use Redis for distributed caching (replace TTLCache)
3. Move database to managed PostgreSQL (already Supabase)
4. Deploy frontend on Vercel or Netlify

---

## 📝 Additional Resources

### Documentation Files
- [SAAD.md](../SAAD.md) — Development summary
- [DRAGON.md](../backend/DRAGON.md) — Backend architecture
- [CLAUDE.md](../frontend/CLAUDE.md) — Frontend guide

### Key Files
- **Backend:** `backend/main.py`, `backend/services/stock_service.py`
- **Frontend:** `frontend/src/app/page.tsx`, `frontend/src/lib/api.ts`
- **Database:** `supabase/tables.sql`
- **Docker:** `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`

### Support & Community
- Report issues via GitHub Issues
- Check existing troubleshooting docs
- Email: support@alphaai.app

---

**Last Updated:** May 16, 2026 | **Maintainer:** AlphaAI Dev Team
