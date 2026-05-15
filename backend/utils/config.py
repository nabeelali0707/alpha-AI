"""
Application Configuration — Step 12 (Enhanced)
Loads and validates environment variables from .env using Pydantic Settings.
"""

import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """
    Centralized app settings.
    All values can be overridden via environment variables or a .env file.
    """

    # ── App ─────────────────────────────────────────────────────────────
    app_name: str = Field(default="AlphaAI API", description="Application name")
    app_version: str = Field(default="1.0.0", description="API version")
    debug: bool = Field(default=False, description="Enable debug mode")
    log_level: str = Field(default="INFO", description="Logging level")

    # ── Server ──────────────────────────────────────────────────────────
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")

    # ── CORS ────────────────────────────────────────────────────────────
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        description="Comma-separated allowed CORS origins",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    # ── API Keys ────────────────────────────────────────────────────────
    newsapi_key: str = Field(
        default="your_newsapi_key_here",
        description="NewsAPI.org API key (get one at https://newsapi.org)",
    )

    # ── AI Model ────────────────────────────────────────────────────────
    sentiment_model: str = Field(
        default="ProsusAI/finbert",
        description="HuggingFace model ID for sentiment analysis",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Singleton instance
settings = Settings()
