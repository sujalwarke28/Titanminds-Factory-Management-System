from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class PredictionResult(BaseModel):
    machine_id: str
    health_score: float
    failure_probability: float
    risk: str
    anomaly_score: float
    confidence: float
    recommendation: str
    explanation: List[str]
    timestamp: datetime
    model_version: Optional[str] = None

