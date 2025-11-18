from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    # Gemini API Configuration
    gemini_api_key: str = "your_gemini_api_key_here"
    
    # Database Configuration
    database_url: str = "postgresql://postgres:postgres@localhost:5432/ai_mentor"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    
    class Config:
        # Look for .env file in parent directory (project root)
        env_file = str(Path(__file__).parent.parent / ".env")
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields in .env that aren't in the model


@lru_cache()
def get_settings():
    return Settings()

