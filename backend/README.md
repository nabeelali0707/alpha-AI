# AlphaAI Backend 🚀

Production-ready FastAPI backend for AI-powered stock market analysis.

## 🛠 Features
- **FastAPI**: High-performance, async-first web framework.
- **Modular Architecture**: Clean separation of routes, models, and services.
- **AI Sentiment**: Specialized endpoints for neural sentiment analysis.
- **Recommendation Engine**: Automated top picks based on market patterns.
- **CORS Support**: Pre-configured for seamless frontend integration.

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

### 3. Run the Server
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
