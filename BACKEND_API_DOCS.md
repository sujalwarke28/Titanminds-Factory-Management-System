# TitanMind Backend API & WebSocket Documentation (Frontend Integration Guide)

This handbook provides complete documentation for frontend engineers integrating with the **TitanMind** predictive maintenance backend service.

---

## 🌐 Server Base URLs

| Environment | HTTP REST Base URL | WebSocket Streaming URL |
|---|---|---|
| **Production (Render)** | `https://titanminds-backend.onrender.com` | `wss://titanminds-backend.onrender.com` |
| **Local Development** | `http://localhost:8100` | `ws://localhost:8100` |

> **Route Prefix Convenience**: All API endpoints support both `/api/exp32/<endpoint>` and root-level `/<endpoint>` (e.g., `/api/exp32/live` and `/live` are identical).

---

## 🔒 CORS & Headers

- **Wildcard CORS**: Enabled for all origins (`Access-Control-Allow-Origin: *`).
- **Request Headers**: Pass `Content-Type: application/json` on all `POST` requests.
- **Preflight Support**: `OPTIONS` requests are handled automatically with HTTP status `204 No Content`.

---

## 📊 Global System Rules & Data Quality

1. **Sensor Data Smoothing**:
   - Temperature readings are noise-filtered using an Exponential Moving Average (EMA) and clamped to `[0°C, 80°C]` to eliminate sensor spikes/drops.
2. **Data Freshness & 5-Second Offline Rule**:
   - If no telemetry is received from a machine for **more than 5 seconds (5000ms)**, the machine is automatically classified as:
     - `status`: `"offline"`
     - `status_message`: `"no data, sensors offline"`
     - `prediction.risk`: `"Sensors Offline"`
3. **Alert Threshold Rules**:
   - **Vibration**: Warning triggered when vibration is detected (`vibration > 0`).
   - **Temperature**: Warning triggered when `temperature > 35°C`.
   - **Sound**: Warning triggered when `sound > 20` (or `sound > 50` for high noise).

---

## 📡 REST API Endpoints

### 1. Health Check
`GET /health`

Verifies that the backend server, MongoDB, and Redis are running cleanly.

#### Response `200 OK`:
```json
{
  "status": "ok"
}
```

---

### 2. Ingest Sensor Data (Telemetry Input)
`POST /api/exp32/sensor-data`

Primary endpoint for telemetry streams (ESP32 hardware or simulation scripts).

#### Request Body Schema:
```json
{
  "machine_id": "CNC_01",
  "temperature": 27.5,
  "humidity": 45.0,
  "raw_sound": 1500,
  "digital_sound": 1,
  "vibration": 0.8,
  "vibration_detected": true,
  "sound": 15,
  "timestamp": "2026-07-24T12:00:00.000Z",
  "metadata": {
    "device": "esp32",
    "source": "exp32"
  }
}
```

#### Possible Responses:

##### Response `201 Created` (Success):
```json
{
  "id": "66a0d4b8f729b12a34567890",
  "machine_id": "CNC_01",
  "mongo_record_id": "66a0d4b8f729b12a34567890",
  "prediction": {
    "machine_id": "CNC_01",
    "health_score": 68,
    "failure_probability": 0.32,
    "risk": "Warning",
    "anomaly_score": 0.38,
    "confidence": 0.6,
    "recommendation": "Inspect Machine",
    "explanation": ["Vibration detected"],
    "issue": "Vibration detected",
    "alerts": ["Vibration detected"],
    "llm_summary": "Analysis completed for CNC_01",
    "timestamp": "2026-07-24T12:00:00.123Z"
  },
  "alerts": [
    {
      "machine_id": "CNC_01",
      "reading_id": "66a0d4b8f729b12a34567890",
      "level": "warning",
      "code": "vibration_detected",
      "message": "Vibration detected",
      "timeline": { "detected_at": "2026-07-24T12:00:00.123Z" },
      "created_at": "2026-07-24T12:00:00.150Z",
      "updated_at": "2026-07-24T12:00:00.150Z",
      "id": "66a0d4b8f729b12a34567891"
    }
  ],
  "log_ids": ["66a0d4b8f729b12a34567892"],
  "alert_ids": ["66a0d4b8f729b12a34567891"],
  "cache_status": "updated",
  "cache_keys": {
    "snapshot": "titanmind:live:CNC_01:snapshot",
    "sensor": "titanmind:live:CNC_01:sensor",
    "prediction": "titanmind:live:CNC_01:prediction",
    "alerts": "titanmind:live:CNC_01:alerts"
  }
}
```

##### Response `400 Bad Request` (Validation Error):
```json
{
  "error": "ValidationError",
  "message": "Invalid sensor payload",
  "issues": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "string",
      "path": ["temperature"],
      "message": "Expected number, received string"
    }
  ]
}
```

##### Response `400 Bad Request` (Malformed JSON):
```json
{
  "error": "RequestError",
  "message": "Malformed JSON body"
}
```

##### Response `500 Internal Server Error`:
```json
{
  "error": "InternalServerError",
  "message": "Database connection error"
}
```

---

### 3. Get Live Machine Snapshots
`GET /api/exp32/live`

Returns real-time state for all monitored machines from Redis. Data older than 5 seconds returns `status: "offline"`.

#### Possible Responses:

##### Response `200 OK` (Online Machine):
```json
{
  "live": [
    {
      "machine_id": "CNC_01",
      "status": "online",
      "status_message": "Live",
      "sensor": {
        "temperature": 27.5,
        "humidity": 45.0,
        "sound": 15,
        "vibration": 0.0,
        "vibration_detected": false
      },
      "prediction": {
        "risk": "Healthy",
        "health_score": 92,
        "recommendation": "Continue Monitoring"
      },
      "alerts": [],
      "updated_at": "2026-07-24T12:00:00.000Z"
    }
  ]
}
```

##### Response `200 OK` (Offline Machine - Data > 5s Old):
```json
{
  "live": [
    {
      "machine_id": "CNC_01",
      "status": "offline",
      "status_message": "no data, sensors offline",
      "prediction": {
        "risk": "Sensors Offline",
        "severity": "offline",
        "recommendation": "no data, sensors offline",
        "issue": "no data, sensors offline",
        "llm_summary": "no data, sensors offline"
      },
      "alerts": [
        {
          "code": "sensors_offline",
          "severity": "critical",
          "message": "no data, sensors offline",
          "timeline": { "detected_at": "2026-07-24T12:00:00.000Z" }
        }
      ],
      "updated_at": "2026-07-24T11:50:00.000Z"
    }
  ]
}
```

---

### 4. Get Historical Updates (Readings, Alerts & Logs)
`GET /api/exp32/allupdates`

Returns combined historical database records grouped by collection.

#### Query Parameters:
- `limit` *(optional)*: Number of items per collection to return (default: `100`, max: `500`).
- `machine_id` *(optional)*: Filter by machine ID (e.g. `?machine_id=CNC_01`).

#### Response `200 OK`:
```json
{
  "readings": [
    {
      "id": "66a0d4b8f729b12a34567890",
      "machine_id": "CNC_01",
      "sensor": { "temperature": 27.5, "vibration": 0.0 },
      "prediction": { "risk": "Healthy" },
      "created_at": "2026-07-24T12:00:00.000Z"
    }
  ],
  "alerts": [
    {
      "id": "66a0d4b8f729b12a34567891",
      "machine_id": "CNC_01",
      "level": "warning",
      "code": "vibration_detected",
      "message": "Vibration detected",
      "created_at": "2026-07-24T12:00:00.150Z"
    }
  ],
  "logs": [
    {
      "id": "66a0d4b8f729b12a34567892",
      "machine_id": "CNC_01",
      "event_type": "sensor_ingested",
      "level": "info",
      "message": "Sensor payload ingested",
      "created_at": "2026-07-24T12:00:00.200Z"
    }
  ]
}
```

---

### 5. Get Alerts Timeline
`GET /api/exp32/alerts`

Returns list of alert events.

#### Query Parameters:
- `limit` *(optional)*: max 500
- `machine_id` *(optional)*

#### Response `200 OK`:
```json
{
  "alerts": [
    {
      "id": "66a0d4b8f729b12a34567891",
      "machine_id": "CNC_01",
      "level": "warning",
      "code": "vibration_detected",
      "message": "Vibration detected",
      "created_at": "2026-07-24T12:00:00.150Z"
    }
  ]
}
```

---

### 6. Get Audit Logs
`GET /api/exp32/logs`

Returns list of operational server logs.

#### Response `200 OK`:
```json
{
  "logs": [
    {
      "id": "66a0d4b8f729b12a34567892",
      "machine_id": "CNC_01",
      "event_type": "live_snapshot_updated",
      "level": "info",
      "message": "Live snapshot updated",
      "created_at": "2026-07-24T12:00:00.200Z"
    }
  ]
}
```

---

### 7. Trigger Twilio Voice Call Alert
`POST /api/exp32/call-alert`

Triggers an outbound automated phone call to the configured admin phone number.

#### Request Body (Optional):
```json
{
  "message": "Call From Titanminds, Problem Detected on your CNC zero one machine, "
}
```

#### Possible Responses:

##### Response `200 OK` (Call Initiated):
```json
{
  "status": "ok",
  "message": "Twilio voice call alert initiated successfully",
  "callSid": "CAea471f30994fc3b9f6c7f26402ddf96f",
  "spoken_text": "Call From Titanminds, Problem Detected on your C N C zero one machine, "
}
```

##### Response `400 Bad Request` (Call Cooldown or Unverified Number):
```json
{
  "status": "error",
  "reason": "Call cooldown active (1 call per 60 seconds allowed)."
}
```

##### Response `500 Internal Server Error` (Twilio Unconfigured):
```json
{
  "status": "error",
  "message": "Twilio service is not configured in backend"
}
```

---

## ⚡ WebSocket Real-Time API (`wss://`)

Connected clients receive real-time streams as new telemetry is ingested or AI predictions update.

### WebSocket Connection Setup

```javascript
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${protocol}//${window.location.host}`; // or "wss://titanminds-backend.onrender.com"

const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  console.log("WebSocket connected");
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.event === "sensor_update") {
    console.log("New sensor telemetry broadcast:", message.data);
  } else if (message.event === "prediction_updated") {
    console.log("Async AI LLM prediction update:", message.data);
  }
};

ws.onclose = () => {
  console.log("WebSocket connection closed. Reconnecting in 3s...");
  setTimeout(connectWebSocket, 3000);
};
```

---

### WebSocket Broadcast Events

#### Event 1: Instant Ingestion Broadcast (`sensor_update`)
Fired immediately (<50ms) upon receiving telemetry:

```json
{
  "event": "sensor_update",
  "data": {
    "record": {
      "id": "66a0d4b8f729b12a34567890",
      "machine_id": "CNC_01",
      "sensor": {
        "machine_id": "CNC_01",
        "temperature": 27.5,
        "humidity": 45.0,
        "sound": 15,
        "vibration": 0.8,
        "vibration_detected": true
      },
      "prediction": {
        "risk": "Warning",
        "health_score": 68,
        "recommendation": "Inspect Machine",
        "issue": "Vibration detected"
      },
      "created_at": "2026-07-24T12:00:00.000Z"
    },
    "alerts": [
      {
        "code": "vibration_detected",
        "severity": "warning",
        "message": "Vibration detected"
      }
    ],
    "logs": []
  }
}
```

#### Event 2: Async AI LLM Insight Broadcast (`prediction_updated`)
Fired when background AI analysis completes (~1.5s later) to enrich the record:

```json
{
  "event": "prediction_updated",
  "data": {
    "record": {
      "id": "66a0d4b8f729b12a34567890",
      "machine_id": "CNC_01",
      "prediction": {
        "risk": "Warning",
        "recommendation": "Inspect machine bearings for imbalance",
        "llm_summary": "LLM Analysis: Vibration detected. Recommended checking spindle alignment."
      }
    }
  }
}
```

#### Event 3: Ping-Pong Heartbeat (`pong`)
To keep WebSocket connections active through proxies (Render, NGINX, Cloudflare), the server sends a ping frame every 20 seconds. If a client sends a JSON ping (`{"type": "ping"}`), the server responds:

```json
{
  "event": "pong"
}
```

---

## 🎨 Twilio Voice Call Setup Reference

- **Spoken Engine**: Amazon Polly Neural (`Polly.Joanna-Neural`)
- **Volume**: SSML `<prosody volume="x-loud">`
- **Spoken Text**: `"Call From Titanminds, Problem Detected on your C N C zero one machine, "`
- **Environment Keys**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `ALERT_PHONE_NUMBER`
