# Smart Factory Predictive Maintenance Backend

Production-style backend for CNC machine predictive maintenance.

Stack: Python 3.12, FastAPI, SQLAlchemy, Scikit-Learn, SHAP, Docker

Run (development):

1. Create a virtualenv and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Run the app:

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

See `.env.example` for environment variables.
