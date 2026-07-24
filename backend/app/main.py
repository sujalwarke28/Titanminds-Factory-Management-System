from __future__ import annotations

from fastapi import FastAPI

from app.api import routes
from app.core.config import settings
from app.services.ingestion_service import IngestionService
from app.services.ml_client import MLBackendClient
from app.services.mongo_store import MongoStore
from app.services.redis_cache import RedisCache


def build_ingestion_service() -> IngestionService:
    ml_client = MLBackendClient(settings.ml_backend_url, settings.request_timeout_seconds)
    mongo_store = MongoStore(settings.mongo_uri, settings.mongo_database, settings.mongo_collection)
    redis_cache = RedisCache(settings.redis_url, settings.redis_key_prefix, settings.redis_live_ttl_seconds)
    return IngestionService(ml_client, mongo_store, redis_cache, settings.ml_backend_url)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)
    app.include_router(routes.router, prefix="/api")

    @app.on_event("startup")
    def startup() -> None:
        app.state.ingestion_service = build_ingestion_service()

    @app.on_event("shutdown")
    def shutdown() -> None:
        service = getattr(app.state, "ingestion_service", None)
        if service is None:
            return
        service.ml_client.close()
        service.mongo_store.close()

    return app


app = create_app()

