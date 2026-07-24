# TitanMind Exp32 Ingestion Backend

This service receives sensor payloads from Exp32, forwards them to the ML backend for inference, stores the combined payload and prediction in MongoDB Atlas, and refreshes live machine state in Redis.

Run locally:

1. Create a virtualenv and install dependencies:

```bash
pip install -r requirements.txt
```

2. Start the API:

```bash
uvicorn app.main:app --reload --port 8100
```

Environment variables are documented in `.env.example`.
