from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime


class AlertCreate(BaseModel):
    machine_id: int
    level: str
    message: str


class AlertRead(AlertCreate):
    id: int
    timestamp: datetime

    class Config:
        orm_mode = True
