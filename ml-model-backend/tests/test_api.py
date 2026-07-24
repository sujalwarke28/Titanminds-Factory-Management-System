from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_root():
    r = client.get("/api/analytics")
    assert r.status_code == 200
