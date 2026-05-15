import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from utils.config import settings
from routes import stocks, analysis, auth

app = FastAPI(
    title=settings.APP_NAME,
    description="Production-ready API for AI-powered Stock Market Analysis",
    version=settings.APP_VERSION
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
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
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
