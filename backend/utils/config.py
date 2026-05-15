from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # App Metadata
    APP_NAME: str = "AlphaAI API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # Database
    DATABASE_URL: str = ""

    # API Keys
    NEWSAPI_KEY: str = ""
    STOCK_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""

    # AI Models
    SENTIMENT_MODEL: str = "ProsusAI/finbert"

    # Security
    SECRET_KEY: str = "your-default-secret-key-change-it"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
