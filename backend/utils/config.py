from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "AlphaAI API"
    admin_email: str = "admin@alphaai.io"
    items_per_user: int = 50
    
    # API Keys (should be in .env)
    market_api_key: str = "DEMO"
    ai_model_id: str = "gpt-4-alpha"

    class Config:
        env_file = ".env"

settings = Settings()
