# TitanMind Exp32 Ingestion Backend

Node.js service that receives sensor data from Exp32, forwards it to the ML backend for prediction, stores the combined reading and prediction in MongoDB Atlas, and updates live machine state in Redis.

## Endpoints

- `GET /health` - liveness check
- `POST /api/exp32/sensor-data` - ingest a sensor reading and return the final prediction

## Payload

```json
{
  "machine_id": "CNC_01",
  "temperature": 63.2,
  "vibration": 1.8,
  "sound": 41.5,
  "timestamp": "2026-07-13T10:00:00.000Z",
  "metadata": {
    "line": "A"
  }
}
```

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables from `.env.example`.

3. Start the service:

```bash
npm start
```

The service listens on port `8100` by default.