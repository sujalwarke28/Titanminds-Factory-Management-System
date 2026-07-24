from __future__ import annotations
from pydantic import BaseModel
from typing import Optional


class MachineBase(BaseModel):
    name: str
    location: Optional[str]


class MachineCreate(MachineBase):
    pass


class MachineRead(MachineBase):
    id: int

    class Config:
        orm_mode = True
