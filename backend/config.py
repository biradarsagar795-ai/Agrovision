"""
Configuration module for the Crop Disease Detection API.

Loads settings from environment variables with sensible defaults.
Uses pydantic-settings for type-safe configuration management.
"""

import os
from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""

    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "CropGuard AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── Server ───────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ── Model Configuration ──────────────────────────────────────
    # Set to True once you have a trained .h5 model file
    USE_REAL_MODEL: bool = False
    MODEL_PATH: str = "model/trained_model/plant_disease_model.h5"
    IMAGE_SIZE: int = 224  # MobileNetV2 input size

    # ── Upload Constraints ───────────────────────────────────────
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,webp"

    # ── Dashboard Additions ──────────────────────────────────────
    WEATHER_API_URL: str = "https://api.open-meteo.com/v1/forecast"
    JWT_SECRET: str = "farmguard_super_secret_key_demo"
    OTP_EXPIRY_SECONDS: int = 300

    # ── CORS (comma-separated origins) ───────────────────────────
    CORS_ORIGINS: str = "*"

    @property
    def max_file_size_bytes(self) -> int:
        """Convert MB limit to bytes."""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def allowed_extensions_list(self) -> list[str]:
        """Parse comma-separated extensions into a list."""
        return [ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",")]

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# ── Base directory paths ─────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR.parent / "uploads"
FRONTEND_DIR = BASE_DIR.parent / "frontend"
DATA_DIR = BASE_DIR / "data"

# Ensure required directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)


@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached Settings instance.
    Using lru_cache ensures the .env file is read only once.
    """
    return Settings()
