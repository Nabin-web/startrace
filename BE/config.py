from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # PostgreSQL database URL
    # Format: postgresql://user:password@host:port/database
    # Example: postgresql://postgres:password@localhost:5432/startrace
    database_url: str = "postgresql://nabinkutu:postgres@localhost:5432/startrace"
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    upload_dir: str = "./uploads"
    
    class Config:
        env_file = ".env"


settings = Settings()

