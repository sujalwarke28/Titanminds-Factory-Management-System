from __future__ import annotations

import json
from datetime import datetime, timezone

import redis

from app.schemas.prediction import PredictionResult
from app.schemas.sensor import SensorPayload


class RedisCache:
    def __init__(self, redis_url: str, key_prefix: str, ttl_seconds: int) -> None:
        self.client = redis.Redis.from_url(redis_url, decode_responses=True)
        self.key_prefix = key_prefix
        self.ttl_seconds = ttl_seconds

    def _machine_prefix(self, machine_id: str) -> str:
        return f"{self.key_prefix}:machine:{machine_id}"

    def update_live_state(self, payload: SensorPayload, prediction: PredictionResult, mongo_record_id: str) -> dict[str, str]:
        machine_prefix = self._machine_prefix(payload.machine_id)
        live_key = f"{machine_prefix}:live"
        sensor_key = f"{machine_prefix}:sensor"
        prediction_key = f"{machine_prefix}:prediction"

        sensor_payload = payload.model_dump(mode="json")
        prediction_payload = prediction.model_dump(mode="json")
        state = {
            "machine_id": payload.machine_id,
            "sensor": sensor_payload,
            "prediction": prediction_payload,
            "mongo_record_id": mongo_record_id,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        pipeline = self.client.pipeline()
        pipeline.setex(sensor_key, self.ttl_seconds, json.dumps(sensor_payload))
        pipeline.setex(prediction_key, self.ttl_seconds, json.dumps(prediction_payload))
        pipeline.setex(live_key, self.ttl_seconds, json.dumps(state))
        pipeline.execute()

        return {
            "live": live_key,
            "sensor": sensor_key,
            "prediction": prediction_key,
        }

