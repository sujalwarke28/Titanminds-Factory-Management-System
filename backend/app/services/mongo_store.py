from __future__ import annotations

from datetime import datetime, timezone

from pymongo import MongoClient

from app.schemas.prediction import PredictionResult
from app.schemas.sensor import SensorPayload


class MongoStore:
    def __init__(self, uri: str, database_name: str, collection_name: str) -> None:
        self.client = MongoClient(uri)
        self.collection = self.client[database_name][collection_name]

    def store_event(self, payload: SensorPayload, prediction: PredictionResult, ml_backend_url: str) -> str:
        document = {
            "machine_id": payload.machine_id,
            "sensor": payload.model_dump(mode="python"),
            "prediction": prediction.model_dump(mode="python"),
            "ml_backend_url": ml_backend_url,
            "source": "exp32",
            "ingested_at": datetime.now(timezone.utc),
        }
        result = self.collection.insert_one(document)
        return str(result.inserted_id)

    def close(self) -> None:
        self.client.close()

