"""
Configuration Management Module

This module handles all application configuration using Pydantic Settings.
Configuration values are loaded from environment variables or a .env file.

The Settings class defines all configurable parameters:
- API keys (Gemini AI)
- Database connection strings
- Server host and port
- Model selection

Configuration is cached using LRU cache for performance.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables or .env file.
    
    All settings can be overridden via environment variables or .env file.
    The .env file is located in the project root (parent directory of backend/).
    
    Attributes:
        gemini_api_key: Google Gemini API key (required for AI features)
        gemini_model: Which Gemini model to use (default: gemini-1.5-flash for free tier)
        database_url: PostgreSQL connection string (optional)
        backend_host: Host to bind the server to (0.0.0.0 = all interfaces)
        backend_port: Port to run the server on (default: 8000)
    """
    # Gemini API Configuration
    gemini_api_key: str = "your_gemini_api_key_here"  # Get from https://makersuite.google.com/app/apikey
    gemini_model: str = "gemini-1.5-flash"  # Use free-tier compatible model by default
    
    # Database Configuration (optional - app works without database)
    database_url: str = "postgresql://postgres:postgres@localhost:5432/ai_mentor"
    backend_host: str = "0.0.0.0"  # 0.0.0.0 allows connections from any interface
    backend_port: int = 8000  # Default FastAPI port
    
    class Config:
        """
        Pydantic configuration for settings loading.
        
        - env_file: Path to .env file (in project root, not backend/)
        - case_sensitive: Environment variable names are case-insensitive
        - extra: Ignore extra fields in .env that aren't defined in Settings
        """
        # Look for .env file in parent directory (project root)
        env_file = str(Path(__file__).parent.parent / ".env")
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields in .env that aren't in the model


@lru_cache()
def get_settings():
    """
    Get application settings (cached for performance).
    
    Uses LRU cache to avoid re-reading environment variables on every call.
    The cache is cleared when the application restarts.
    
    Returns:
        Settings: Application configuration object
    """
    return Settings()

