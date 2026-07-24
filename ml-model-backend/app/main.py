from fastapi import FastAPI
from app.api import routes
from app.database.session import engine
from app.models import models
from app.utils import logging_config


def create_app() -> FastAPI:
    app = FastAPI(title="TitanMind Predictive Maintenance API")
    app.include_router(routes.router, prefix="/api")
    return app


app = create_app()


@app.on_event("startup")
def on_startup():
    # create tables
    models.Base.metadata.create_all(bind=engine)


# Ensure tables exist even if startup events are not run in some test environments
try:
    models.Base.metadata.create_all(bind=engine)
except Exception:
    pass
