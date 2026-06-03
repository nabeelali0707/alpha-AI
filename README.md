# 🐉 AlphaAI — AI-Powered Stock Market Analyzer

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009485?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-000000?style=flat&logo=nextjs)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776ab?style=flat&logo=python)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=flat&logo=docker)](https://docker.com)

**AlphaAI** is a comprehensive, AI-driven stock market analysis platform built to empower investors with real-time data, advanced risk metrics, and intelligent recommendations. Designed with robust architecture and modern technologies, it supports global markets, including dedicated integration for the Pakistan Stock Exchange (PSX), alongside full Urdu localization.

---

## 🌟 Key Features

- **Real-Time Market Data** — Live pricing, OHLCV historical charts, and fundamental company data.
- **AI-Powered Recommendations** — Automated BUY/SELL/HOLD signals backed by confidence scores and technical reasoning.
- **Advanced Risk Analytics** — In-depth metrics including Sharpe Ratio, Beta, and Maximum Drawdown.
- **Comprehensive Technical Indicators** — Built-in analysis using RSI, MACD, Bollinger Bands, and Volatility tracking.
- **Global Market Coverage** — Support for US equities, PSX, cryptocurrencies, forex, commodities, and major indices.
- **Urdu Localization** — Translated financial glossary and native Urdu support for AI recommendations.
- **Portfolio Management** — Secure, authenticated portfolio tracking with real-time Profit & Loss (P&L) calculation.
- **Enterprise-Ready Deployment** — Fully containerized with Docker for seamless production deployment.

---

## 🚀 Quick Start

Get AlphaAI up and running locally in just a few minutes.

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git
- Docker (optional, for containerized setup)

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/alphaai.git
   cd alphaai
   ```

2. **Start the Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8001
   ```

3. **Start the Frontend (in a new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

**Access Points:**
- **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8001](http://localhost:8001)
- **API Documentation (Swagger UI):** [http://localhost:8001/docs](http://localhost:8001/docs)

### Docker Setup

For a streamlined, containerized deployment:
```bash
docker-compose up --build
```
*The services will be available on the same ports as the local setup.*

---

## 📡 Core API Endpoints

The backend provides a comprehensive RESTful API for market data and analysis.

### Market Data
- `GET /api/v1/stocks/{symbol}` — Current ticker price
- `GET /api/v1/stocks/{symbol}/history` — OHLCV historical data
- `GET /api/v1/stocks/{symbol}/info` — Company fundamentals

### Analysis & AI
- `GET /api/v1/analysis/technical/{symbol}` — Technical indicators & risk metrics
- `GET /api/v1/analysis/recommend/{symbol}` — AI trading recommendations
- `GET /api/v1/analysis/urdu/recommend/{symbol}` — Urdu-localized explanations

### Portfolio Management (Requires Auth)
- `GET /api/v1/portfolio/holdings` — Retrieve user holdings
- `POST /api/v1/portfolio/holdings` — Add a new holding
- `GET /api/v1/portfolio/summary` — P&L summary

*For the complete API reference, visit the interactive Swagger UI at `/docs`.*

---

## 🇵🇰 Pakistan Stock Exchange (PSX) Integration

AlphaAI features built-in, dedicated support for major PSX companies, catering specifically to the Pakistani market.

| Symbol | Company |
|--------|---------|
| ENGRO.KA | Engro Corporation |
| HBL.KA | Habib Bank Limited |
| MCB.KA | MCB Bank |
| LUCK.KA | Lucky Cement |
| OGDC.KA | Oil & Gas Development Company |

**Custom Data Ingestion:** To add additional PSX data, place your CSV files in `backend/psx_data/` and execute the ingestion script:
```bash
python backend/scripts/psx_ingest.py
```

---

## 🌐 Supported Markets

| Category | Coverage | Examples |
|----------|-------|----------|
| **PSX** | 15+ Top Companies | ENGRO.KA, HBL.KA, MCB.KA |
| **US Stocks** | Global Equities | AAPL, MSFT, NVDA, TSLA |
| **Cryptocurrency**| Top Market Cap | BTC-USD, ETH-USD, SOL-USD |
| **Forex** | Major Pairs | USD/PKR, EUR/USD, GBP/USD |
| **Commodities** | Major Assets | Gold, Oil, Natural Gas |
| **Indices** | Global Benchmarks | S&P 500, NASDAQ, Dow Jones |

---

## 🤖 Intelligent Architecture

### AI Recommendation Engine
Generates actionable insights combining multiple technical indicators into a unified confidence score.

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

### Risk & Performance Metrics
- **Sharpe Ratio** for risk-adjusted return analysis.
- **Beta** for measuring market correlation and volatility.
- **Maximum Drawdown** for assessing historical downside risk.

---

## 🌍 Technology Stack

**Frontend Framework**
- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS & Recharts
- Supabase Client

**Backend Infrastructure**
- Python 3.11 with FastAPI
- Pandas, NumPy, yfinance
- HuggingFace Transformers
- PostgreSQL (via Supabase)

**DevOps & Security**
- Docker & Docker Compose
- Supabase Auth (JWT)
- Rate Limiting (SlowAPI)
- Row-Level Security (RLS)

---

## ⚙️ Configuration

Configure your environment variables before starting the application:

**Backend (`backend/.env`)**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

**Frontend (`frontend/.env.local`)**
```env
NEXT_PUBLIC_ALPHAAI_API_BASE_URL=http://localhost:8001/api/v1
```

---

## 📚 Project Documentation

Detailed documentation on the architecture and development setup can be found in the following files:
- [**SETUP.md**](SETUP.md) — Comprehensive environment and database setup guide
- [**SAAD.md**](SAAD.md) — System Architecture and Design Document
- [**backend/DRAGON.md**](backend/DRAGON.md) — Backend services and AI engine details
- [**frontend/CLAUDE.md**](frontend/CLAUDE.md) — Frontend component and state management guide

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve AlphaAI, please follow these steps:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

*Developed with passion for open-source and intelligent financial technology.*
