# AlphaAI Backend 🚀

Production-ready FastAPI backend for AI-powered stock market analysis.

## 🛠 Features
- **FastAPI**: High-performance, async-first web framework.
- **Modular Architecture**: Clean separation of routes, models, and services.
- **AI Sentiment**: Specialized endpoints for neural sentiment analysis.
- **Recommendation Engine**: Automated top picks based on market patterns.
- **CORS Support**: Pre-configured for seamless frontend integration.

## API Overview

- `GET /health`
- `GET /api/v1/stocks/{symbol}`
- `GET /api/v1/stocks/{symbol}/history`
- `GET /api/v1/stocks/{symbol}/info`
- `GET /api/v1/analysis/sentiment/{symbol}`
- `GET /api/v1/analysis/recommend/{symbol}`
- `GET /api/v1/analysis/recommendations`
- `GET /api/v1/analysis/technical/{symbol}`
- `GET /api/v1/analysis/news/{symbol}`
- `GET /api/v1/analysis/dashboard/{symbol}`

## 📁 Project Structure
```text
backend/
├── main.py            # Entry point & app initialization
├── routes/            # API endpoints grouped by domain
├── services/          # Business logic & external API integrations
├── models/            # Pydantic schemas for request/response
├── utils/             # Helper functions & configuration
└── requirements.txt   # Dependency list
```

## 🚀 Getting Started

### 1. Set up a Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
Copy `.env.example` to `.env` and add your NewsAPI key.

### 4. Run the Server
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

## 📖 API Documentation
Once the server is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🛡 System Status
Check system health at `http://localhost:8000/health`.

## Notes

- If `NEWSAPI_KEY` is missing, the backend falls back to safe sample headlines so the API remains usable during development.
- Technical and news requests are cached in memory to reduce repeated third-party API calls.
