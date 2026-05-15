# 🐉 DRAGON — AlphaAI Backend Documentation

> **D**ata-driven **R**ecommendation and **A**nalysis en**G**ine for st**O**ck **N**avigation

---

## 🔥 What is AlphaAI?

AlphaAI is an **AI-powered stock market analyzer** built with **FastAPI**, **FinBERT**, and real-time financial data. It provides intelligent BUY/SELL/HOLD recommendations by combining:

- 🤖 **AI Sentiment Analysis** — FinBERT (HuggingFace) analyzes financial news headlines
- 📊 **Technical Indicators** — RSI, MACD, Moving Averages, Volatility
- 📈 **Real-time Stock Data** — Live prices and history via yfinance
- 📰 **News Aggregation** — Latest financial news from NewsAPI
- 💡 **Algorithmic Recommendations** — Weighted scoring engine (100-point system)

---

## 🏗️ Architecture

```
backend/
├── main.py                    # FastAPI app entry point
├── .env                       # Environment variables (secrets)
├── .env.example               # Template for .env
├── requirements.txt           # Python dependencies
├── DRAGON.md                  # 🐉 You are here
│
├── routes/                    # API endpoint definitions
│   ├── __init__.py
│   ├── stocks.py              # Stock price, history, metadata
│   └── analysis.py            # Sentiment, recommendations, dashboard
│
├── services/                  # Business logic layer
│   ├── __init__.py
│   ├── stock_service.py       # yfinance data fetching
│   ├── stock_api.py           # HTTP-based stock API client
│   ├── sentiment_ai.py        # FinBERT sentiment analysis
│   ├── news_service.py        # NewsAPI integration
│   ├── technical_service.py   # RSI, MACD, MA, Volatility
│   └── recommender.py         # AI recommendation engine
│
├── models/                    # Pydantic response schemas
│   ├── __init__.py
│   ├── stock.py               # All response models
│   └── analysis.py            # Re-exports for compatibility
│
└── utils/                     # Configuration & utilities
    ├── __init__.py
    ├── config.py              # Pydantic Settings (.env loader)
    └── error_handlers.py      # Centralized exception handling
```

---

## 🚀 Quick Start

### 1. Clone & Navigate
```bash
cd alpha-AI/backend
```

### 2. Create Virtual Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
# Copy the template
cp .env.example .env

# Edit .env and add your real API keys
# REQUIRED: Get a free NewsAPI key at https://newsapi.org/register
```

### 5. Run the Server
```bash
uvicorn main:app --reload
```

The API will be live at **`http://localhost:8000`**

### 6. Explore the Docs
- 📖 **Swagger UI**: http://localhost:8000/docs
- 📚 **ReDoc**: http://localhost:8000/redoc
- ❤️ **Health Check**: http://localhost:8000/health

---

## 📡 API Endpoints

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check & version info |

### Stocks (`/api/v1/stocks`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/{symbol}` | Current stock price |
| `GET` | `/{symbol}/info` | Company metadata & fundamentals |
| `GET` | `/{symbol}/history?period=1mo` | Historical OHLCV data |

### AI Analysis (`/api/v1/analysis`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sentiment/{symbol}` | AI sentiment analysis (FinBERT) |
| `GET` | `/recommend/{symbol}` | BUY/SELL/HOLD recommendation |
| `GET` | `/recommendations` | Top picks across popular tickers |
| `GET` | `/technical/{symbol}` | RSI, MACD, MA, Volatility |
| `GET` | `/news/{symbol}` | Latest financial news articles |
| `GET` | `/dashboard/{symbol}` | Combined dashboard (all data in one call) |

---

## 🧠 How the Recommendation Engine Works

The engine uses a **100-point weighted scoring system**:

| Factor | Weight | Signal |
|--------|--------|--------|
| 📰 News Sentiment | 30 pts | FinBERT BULLISH/BEARISH/NEUTRAL |
| 📉 RSI | 20 pts | Oversold (<30) / Overbought (>70) |
| 📊 MACD | 20 pts | Bullish / Bearish crossover |
| 📈 Moving Averages | 20 pts | Golden Cross / Death Cross |
| 🌊 Volatility | 10 pts | High / Moderate / Low risk |

### Decision Thresholds
| Score | Recommendation |
|-------|---------------|
| **≥ 65** | 🟢 **BUY** |
| **36–64** | 🟡 **HOLD** |
| **≤ 35** | 🔴 **SELL** |

### Example Response
```json
{
  "symbol": "AAPL",
  "recommendation": "BUY",
  "confidence": 0.72,
  "score": 72.0,
  "explanation": "Our analysis indicates a favorable buying opportunity.\n\nKey factors:\n  • Positive market sentiment (score: 0.45)\n  • RSI at 52.3 — within normal range\n  • MACD shows bullish crossover\n  • Golden cross detected (SMA-50 > SMA-200)\n  • Moderate volatility",
  "reasons": ["..."],
  "technical_indicators": { "..." },
  "sentiment_summary": { "..." },
  "price_data": { "..." }
}
```

---

## 🔑 Required Credentials

| Service | Key | How to Get |
|---------|-----|------------|
| **NewsAPI** | `NEWSAPI_KEY` | Free at [newsapi.org/register](https://newsapi.org/register) |

> ⚠️ **Without a NewsAPI key**, the app will use fallback sample headlines for sentiment analysis. The rest of the API will work fine.

> 💡 **yfinance** and **FinBERT** do NOT require API keys — they are free and open-source.

---

## 🛡️ Error Handling

The API uses centralized error handling with clean JSON responses:

```json
{
  "error": "Invalid ticker symbol: XYZ123",
  "detail": "No data found for ticker 'XYZ123'. Please verify the symbol.",
  "status_code": 404
}
```

**Handled error types:**
- ❌ Invalid stock tickers → `404`
- ⚠️ Validation errors → `422`
- 🚫 Rate limit exceeded → `429`
- 💥 External API failures → `502`
- 🔥 Unhandled exceptions → `500` (logged with full traceback)

---

## 📊 Technical Indicators Explained

### RSI (Relative Strength Index)
- **> 70**: Overbought — price may pull back
- **< 30**: Oversold — potential buying opportunity
- **30–70**: Normal trading range

### MACD (Moving Average Convergence Divergence)
- **MACD > Signal**: Bullish momentum
- **MACD < Signal**: Bearish momentum
- **Histogram**: Strength of the signal

### Moving Averages
- **SMA-20/50/200**: Simple Moving Averages
- **EMA-12/26**: Exponential Moving Averages
- **Golden Cross** (SMA-50 > SMA-200): Strong bullish signal
- **Death Cross** (SMA-50 < SMA-200): Bearish signal

### Volatility
- Annualized historical volatility from log returns
- **< 20%**: Low risk | **20–40%**: Moderate | **> 40%**: High risk

---

## 🐉 Why "DRAGON"?

Because every great project needs a codename. DRAGON stands for:

> **D**ata-driven **R**ecommendation and **A**nalysis en**G**ine for st**O**ck **N**avigation

Just like a dragon guards its treasure, AlphaAI guards your portfolio with AI-powered insights. 🔥

---

## 📄 License

This project is for educational and research purposes. Stock recommendations are AI-generated and should NOT be treated as financial advice. Always do your own research before making investment decisions.

---

*Built with ❤️ and 🐉 by the AlphaAI team*
