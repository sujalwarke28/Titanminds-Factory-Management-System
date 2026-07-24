from __future__ import annotations
try:
    from pydantic_settings import BaseSettings
    from pydantic import Field
except Exception:
    from pydantic import BaseSettings, Field
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "titanmind-pm-backend"
    environment: str = "development"
    database_url: str = Field(..., env="DATABASE_URL")
    secret_key: str = Field(..., env="SECRET_KEY")
    model_dir: str = Field("./models", env="MODEL_DIR")
    model_name: str = Field("rf_model.joblib", env="MODEL_NAME")
    model_type: str = Field("random_forest", env="MODEL_TYPE")
    log_level: str = Field("INFO", env="LOG_LEVEL")
    train_min_samples: int = Field(200, env="TRAIN_MIN_SAMPLES")

    class Config:
        env_file = ".env"


def get_settings() -> Settings:
    settings = Settings()
    Path(settings.model_dir).mkdir(parents=True, exist_ok=True)
    return settings


settings = get_settings()
