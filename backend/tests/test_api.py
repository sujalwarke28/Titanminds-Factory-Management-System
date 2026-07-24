from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


class FakeService:
    def ingest(self, payload):
        return {
            "machine_id": payload.machine_id,
            "mongo_record_id": "mongo123",
            "prediction": {
                "machine_id": payload.machine_id,
                "health_score": 91.2,
                "failure_probability": 0.08,
                "risk": "Healthy",
                "anomaly_score": 0.01,
                "confidence": 0.94,
                "recommendation": "Continue Monitoring",
                "explanation": ["stable vibration"],
                "timestamp": payload.timestamp,
                "model_version": "v1",
            },
            "cache_status": "updated",
            "cache_keys": {
                "live": "titanmind:machine:CNC_01:live",
                "sensor": "titanmind:machine:CNC_01:sensor",
                "prediction": "titanmind:machine:CNC_01:prediction",
            },
        }


def test_ingest_sensor_data(monkeypatch):
    app.state.ingestion_service = FakeService()
    client = TestClient(app)

    response = client.post(
        "/api/exp32/sensor-data",
        json={
            "machine_id": "CNC_01",
            "temperature": 36.4,
            "vibration": 0.17,
            "sound": 58.2,
            "timestamp": "2026-07-13T12:00:00Z",
            "metadata": {"shift": "A"},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["machine_id"] == "CNC_01"
    assert body["mongo_record_id"] == "mongo123"
    assert body["prediction"]["risk"] == "Healthy"
    assert body["cache_status"] == "updated"

