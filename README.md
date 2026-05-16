# 🐉 AlphaAI — AI-Powered Stock Market Analyzer

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009485?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-000000?style=flat&logo=nextjs)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776ab?style=flat&logo=python)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=flat&logo=docker)](https://docker.com)

**Production-ready AI stock analyzer** with real-time data, risk metrics, Urdu localization, and PSX support.

---

## 🌟 Features at a Glance

✅ **Live Stock Data** — Real-time pricing, OHLCV history, fundamentals  
✅ **AI Recommendations** — BUY/SELL/HOLD signals with confidence scores  
✅ **Risk Analytics** — Sharpe Ratio, Beta, Max Drawdown  
✅ **Technical Indicators** — RSI, MACD, Bollinger Bands, Volatility  
✅ **Global Markets** — US stocks, PSX, crypto, forex, commodities, indices  
✅ **Urdu Support** — Translated financial glossary + Urdu recommendations  
✅ **Portfolio Tracking** — Secure holdings management with P&L  
✅ **Docker Ready** — Production-grade containerized deployment  

---

## 🚀 Quick Start (2 Minutes)

### Prerequisites
```
Python 3.11+  |  Node.js 18+  |  Git
```

### Development Setup

```bash
# 1. Clone & navigate
git clone https://github.com/your-org/alphaai.git
cd alphaai

# 2. Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# 3. Frontend (in new terminal)
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8001
- API Docs: http://localhost:8001/docs

### Docker Deployment

```bash
docker-compose up --build
# Same ports as above
```

---

## 📡 API Endpoints

### Stock Data
```
GET  /api/v1/stocks/{symbol}               # Current price
GET  /api/v1/stocks/{symbol}/history       # OHLCV data
GET  /api/v1/stocks/{symbol}/info          # Company fundamentals
```

### Analysis & AI
```
GET  /api/v1/analysis/technical/{symbol}   # Indicators + risk metrics
GET  /api/v1/analysis/recommend/{symbol}   # AI recommendation (BUY/SELL/HOLD)
GET  /api/v1/analysis/urdu/recommend/{symbol}  # Urdu explanation
```

### Markets
```
GET  /api/v1/stocks/market/overview        # All markets grouped
GET  /api/v1/stocks/market/psx             # PSX tickers (15+)
GET  /api/v1/stocks/market/crypto          # Top crypto (12)
GET  /api/v1/stocks/market/forex           # Forex pairs (10+)
```

### Portfolio (requires auth)
```
GET  /api/v1/portfolio/holdings            # User holdings
POST /api/v1/portfolio/holdings            # Add holding
GET  /api/v1/portfolio/summary             # P&L summary
```

**Full docs:** `http://localhost:8001/docs` (Swagger UI)

---

## 🇵🇰 Pakistan Stock Exchange (PSX)

Built-in support for 15+ major PSX companies:

| Symbol | Company |
|--------|---------|
| ENGRO.KA | Engro Corporation |
| HBL.KA | Habib Bank Limited |
| MCB.KA | MCB Bank |
| LUCK.KA | Lucky Cement |
| OGDC.KA | Oil & Gas Dev Corp |

**Add PSX data:** Place CSV files in `backend/psx_data/`, then run:
```bash
python backend/scripts/psx_ingest.py
```

---

## 🌐 Market Coverage

| Category | Count | Examples |
|----------|-------|----------|
| **PSX** | 15+ | ENGRO.KA, HBL.KA, MCB.KA |
| **US Stocks** | 12+ | AAPL, MSFT, NVDA, TSLA |
| **Crypto** | 12 | BTC-USD, ETH-USD, SOL-USD |
| **Forex** | 10+ | USD/PKR, EUR/USD, GBP/USD |
| **Commodities** | 8 | Gold, Oil, Natural Gas |
| **Indices** | 8 | S&P 500, NASDAQ, Dow Jones |

---

## 🤖 AI Features

### Recommendation Engine
```json
{
  "symbol": "AAPL",
  "signal": "BUY",
  "confidence": 78.5,
  "reasons": {
    "rsi_signal": "OVERSOLD",
    "moving_average_trend": "GOLDEN_CROSS",
    "macd_signal": "BULLISH"
  },
  "urdu_explanation": "خریدنے کی سفارش ہے۔..."
}
```

### Technical Indicators
- **RSI** — Overbought/oversold detection
- **MACD** — Trend confirmation
- **Moving Averages** — SMA-20/50/200, EMA-12/26
- **Bollinger Bands** — Support/resistance levels
- **Volatility** — Risk assessment

### Risk Metrics
- **Sharpe Ratio** — Risk-adjusted returns
- **Beta** — Correlation with market
- **Max Drawdown** — Historical downside

---

## 🌍 Tech Stack

### Backend
```
FastAPI 0.111.0  |  Uvicorn  |  Python 3.11
Pandas  |  NumPy  |  yfinance  |  HuggingFace Transformers
Supabase (PostgreSQL)  |  SlowAPI (rate limiting)  |  cachetools
```

### Frontend
```
Next.js 16.2.6  |  React 19  |  TypeScript
Tailwind CSS  |  Recharts  |  Supabase JS Client
```

### DevOps
```
Docker & Docker Compose  |  PostgreSQL 15
Uvicorn (backend)  |  Next.js dev/prod
```

---

## ⚙️ Environment Setup

### Backend (.env)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_ALPHAAI_API_BASE_URL=http://localhost:8001/api/v1
```

---

## 📊 Database Schema

Automatic schema migration on startup:
- `profiles` — User profiles
- `portfolio_holdings` — User stocks & P&L
- `watchlist` — Favorite symbols
- `psx_stocks` — PSX stock catalog
- `alerts` — Price alerts (future)

---

## 🔐 Security

✅ Supabase Auth (JWT tokens)  
✅ Rate limiting (10 req/min on dashboard)  
✅ CORS protection  
✅ Pydantic input validation  
✅ Row-level security (RLS) on Supabase  

---

## 📈 Performance

| Component | Cache TTL | Typical Response |
|-----------|-----------|-----------------|
| Stock Price | 30 sec | ~50ms |
| Historical Data | 5 min | ~100ms |
| Indicators | 5 min | ~200ms |
| Company Info | 1 hr | ~80ms |

---

## 🐳 Production Deployment

### Recommended Platforms

**Backend:** Render, Railway, AWS EC2  
**Frontend:** Vercel, Netlify  
**Database:** Supabase (free PostgreSQL)  

### Docker Compose (Self-Hosted)

```bash
docker-compose up -d

# Access:
# Frontend: http://localhost:3000
# Backend: http://localhost:8001
# Postgres: localhost:5432
```

---

## 📚 Documentation

- **[SETUP.md](SETUP.md)** — Detailed setup guide
- **[SAAD.md](SAAD.md)** — Development overview
- **[backend/DRAGON.md](backend/DRAGON.md)** — Backend architecture
- **[frontend/CLAUDE.md](frontend/CLAUDE.md)** — Frontend guide

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing`
5. Open Pull Request

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

## 📞 Support

- **Issues:** GitHub Issues
- **Email:** support@alphaai.app
- **Community:** [Discord](https://discord.gg/alphaai)

---

**Version:** 1.0 | **Status:** Production-Ready MVP  
**Made with ❤️ for Pakistani investors & global traders**
