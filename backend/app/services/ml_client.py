from __future__ import annotations

import httpx

from app.schemas.prediction import PredictionResult
from app.schemas.sensor import SensorPayload


class MLBackendClient:
    def __init__(self, base_url: str, timeout_seconds: float) -> None:
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(base_url=self.base_url, timeout=timeout_seconds)

    def predict(self, payload: SensorPayload) -> PredictionResult:
        response = self._client.post("/api/predict", json=payload.model_dump(mode="json"))
        response.raise_for_status()
        return PredictionResult.model_validate(response.json())

    def close(self) -> None:
        self._client.close()

