from __future__ import annotations

from fastapi import APIRouter, Depends

from app.dependencies import get_ingestion_service
from app.schemas.sensor import IngestionResponse, SensorPayload
from app.services.ingestion_service import IngestionService


router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/exp32/sensor-data", response_model=IngestionResponse)
def ingest_sensor_data(
    payload: SensorPayload,
    service: IngestionService = Depends(get_ingestion_service),
) -> dict[str, object]:
    return service.ingest(payload)

