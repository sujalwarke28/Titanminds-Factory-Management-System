from __future__ import annotations
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SensorPayload(BaseModel):
    machine_id: str = Field(..., example="CNC_01")
    temperature: float
    vibration: float
    sound: float
    timestamp: datetime


class SensorResponse(BaseModel):
    id: int
    machine_id: str
    temperature: float
    vibration: float
    sound: float
    timestamp: datetime

    class Config:
        orm_mode = True
