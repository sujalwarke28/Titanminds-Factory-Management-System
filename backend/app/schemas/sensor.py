from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

from pydantic import BaseModel, Field

from app.schemas.prediction import PredictionResult


class SensorPayload(BaseModel):
    machine_id: str = Field(..., examples=["CNC_01"])
    temperature: float
    vibration: float
    sound: float
    timestamp: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)


class IngestionResponse(BaseModel):
    machine_id: str
    mongo_record_id: str
    prediction: PredictionResult
    cache_status: str
    cache_keys: Dict[str, str]

