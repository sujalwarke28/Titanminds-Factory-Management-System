from __future__ import annotations

from fastapi import HTTPException, Request

from app.services.ingestion_service import IngestionService


def get_ingestion_service(request: Request) -> IngestionService:
    service = getattr(request.app.state, "ingestion_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Ingestion service is not initialized")
    return service

