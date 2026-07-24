from __future__ import annotations

from app.schemas.sensor import SensorPayload
from app.services.ml_client import MLBackendClient
from app.services.mongo_store import MongoStore
from app.services.redis_cache import RedisCache


class IngestionService:
    def __init__(self, ml_client: MLBackendClient, mongo_store: MongoStore, redis_cache: RedisCache, ml_backend_url: str) -> None:
        self.ml_client = ml_client
        self.mongo_store = mongo_store
        self.redis_cache = redis_cache
        self.ml_backend_url = ml_backend_url

    def ingest(self, payload: SensorPayload) -> dict[str, object]:
        prediction = self.ml_client.predict(payload)
        mongo_record_id = self.mongo_store.store_event(payload, prediction, self.ml_backend_url)

        cache_status = "updated"
        cache_keys: dict[str, str] = {}
        try:
            cache_keys = self.redis_cache.update_live_state(payload, prediction, mongo_record_id)
        except Exception:
            cache_status = "unavailable"

        return {
            "machine_id": payload.machine_id,
            "mongo_record_id": mongo_record_id,
            "prediction": prediction.model_dump(mode="python"),
            "cache_status": cache_status,
            "cache_keys": cache_keys,
        }

