from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class PredictionResponse(BaseModel):
    machine_id: str
    health_score: float
    failure_probability: float
    risk: str
    anomaly_score: float
    confidence: float
    recommendation: str
    explanation: List[str]
    timestamp: datetime


class ModelInfoSchema(BaseModel):
    name: str
    version: str
    type: str
    metadata: dict
