import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import stocks, analysis

app = FastAPI(
    title="AlphaAI Backend",
    description="Production-ready API for AI-powered Stock Market Analysis",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "operational", "version": "1.0.0"}

# Include Routers
app.include_router(stocks.router, prefix="/api/v1/stocks", tags=["Stocks"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["AI Analysis"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
