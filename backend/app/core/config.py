from __future__ import annotations

try:
    from pydantic_settings import BaseSettings
    from pydantic import Field
except Exception:
    from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    app_name: str = Field("titanmind-exp32-backend", env="APP_NAME")
    environment: str = Field("development", env="ENVIRONMENT")
    ml_backend_url: str = Field("http://localhost:8000", env="ML_BACKEND_URL")
    mongo_uri: str = Field("mongodb://localhost:27017", env="MONGODB_URI")
    mongo_database: str = Field("titanmind", env="MONGODB_DATABASE")
    mongo_collection: str = Field("sensor_events", env="MONGODB_COLLECTION")
    redis_url: str = Field("redis://localhost:6379/0", env="REDIS_URL")
    redis_key_prefix: str = Field("titanmind", env="REDIS_KEY_PREFIX")
    redis_live_ttl_seconds: int = Field(86400, env="REDIS_LIVE_TTL_SECONDS")
    request_timeout_seconds: float = Field(10.0, env="ML_REQUEST_TIMEOUT_SECONDS")

    class Config:
        env_file = ".env"


settings = Settings()
