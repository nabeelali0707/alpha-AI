"""
Application Configuration — Step 12 (Enhanced)
Loads and validates environment variables from .env using Pydantic Settings.
"""

from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    port: int = Field(default=8001, description="Server port")

    # ── CORS ───────────────────────────────────────────────────────────
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        description="Comma-separated allowed CORS origins",
    )

    # ── Database / External Services ────────────────────────────────────
    database_url: str = Field(default="", description="Database connection URL")
    newsapi_key: str = Field(default="", description="NewsAPI.org API key")
    stock_api_key: str = Field(default="", description="Optional stock API key")
    google_api_key: str = Field(default="", description="Optional Google API key")
    supabase_url: str = Field(default="", description="Supabase project URL")
    supabase_anon_key: str = Field(default="", description="Supabase anon public key")
    supabase_service_role: str = Field(default="", description="Supabase service role key")

    # ── AI Model ──────────────────────────────────────────────────
    sentiment_model: str = Field(
        default="ProsusAI/finbert",
        description="HuggingFace model ID for sentiment analysis",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @field_validator("port")
    @classmethod
    def validate_port(cls, value: int) -> int:
        if value < 1 or value > 65535:
            raise ValueError("port must be between 1 and 65535")
        return value

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, value: str) -> str:
        origins = [origin.strip() for origin in value.split(",") if origin.strip()]
        if not origins:
            raise ValueError("cors_origins must include at least one origin")
        return value


# Singleton instance
settings = Settings()