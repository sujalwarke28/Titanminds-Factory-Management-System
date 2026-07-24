from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models import models as orm_models
from app.schemas.sensor import SensorPayload, SensorResponse
from app.schemas.machine import MachineCreate, MachineRead
from app.schemas.prediction import PredictionResponse, ModelInfoSchema
from app.schemas.alert import AlertCreate, AlertRead
from app.services import prediction_service
from datetime import datetime

router = APIRouter()


@router.post("/sensor-data", response_model=SensorResponse)
def receive_sensor(payload: SensorPayload, db: Session = Depends(get_db)):
    try:
        machine = prediction_service.build_or_get_machine(payload, db)
        reading = prediction_service.create_sensor_reading(payload, db, machine)
        prediction_service.predict_for_machine(machine.id, db)
    except Exception:
        machine = db.query(orm_models.Machine).filter(orm_models.Machine.name == payload.machine_id).first()
        reading = db.query(orm_models.SensorReading).order_by(orm_models.SensorReading.id.desc()).first()

    return SensorResponse(
        id=reading.id,
        machine_id=machine.name,
        temperature=reading.temperature,
        vibration=reading.vibration,
        sound=reading.sound,
        timestamp=reading.timestamp,
    )


@router.post("/predict", response_model=PredictionResponse)
def predict_sensor(payload: SensorPayload, db: Session = Depends(get_db)):
    result = prediction_service.predict_from_payload(payload, db)
    return PredictionResponse(**result)


@router.get("/machines", response_model=List[MachineRead])
def list_machines(db: Session = Depends(get_db)):
    machines = db.query(orm_models.Machine).all()
    return machines


@router.get("/machine/{machine_id}", response_model=MachineRead)
def get_machine(machine_id: int, db: Session = Depends(get_db)):
    m = db.query(orm_models.Machine).get(machine_id)
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")
    return m


@router.get("/prediction/{machine_id}", response_model=PredictionResponse)
def get_prediction(machine_id: int, db: Session = Depends(get_db)):
    p = db.query(orm_models.Prediction).filter(orm_models.Prediction.machine_id == machine_id).order_by(orm_models.Prediction.timestamp.desc()).first()
    if not p:
        raise HTTPException(status_code=404, detail="No prediction for machine")
    return PredictionResponse(
        machine_id=db.query(orm_models.Machine).get(machine_id).name,
        health_score=p.health_score,
        failure_probability=p.failure_probability,
        risk=p.risk_level,
        anomaly_score=p.anomaly_score,
        confidence=p.confidence,
        recommendation=p.recommendation,
        explanation=p.explanation or [],
        timestamp=p.timestamp,
    )


@router.get("/health-score/{machine_id}")
def get_health_score(machine_id: int, db: Session = Depends(get_db)):
    p = db.query(orm_models.Prediction).filter(orm_models.Prediction.machine_id == machine_id).order_by(orm_models.Prediction.timestamp.desc()).first()
    if not p:
        raise HTTPException(status_code=404, detail="No health score")
    return {"machine_id": machine_id, "health_score": p.health_score, "timestamp": p.timestamp}


@router.get("/history/{machine_id}")
def history(machine_id: int, db: Session = Depends(get_db), page: int = 1, limit: int = 100):
    """Return paginated sensor history for a machine (page, limit)."""
    if page < 1:
        page = 1
    if limit < 1:
        limit = 100
    base_q = db.query(orm_models.SensorReading).filter(orm_models.SensorReading.machine_id == machine_id).order_by(orm_models.SensorReading.timestamp.desc())
    readings = base_q.offset((page - 1) * limit).limit(limit).all()
    return [
        {
            "temperature": r.temperature,
            "vibration": r.vibration,
            "sound": r.sound,
            "timestamp": r.timestamp,
        }
        for r in readings
    ]


@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(orm_models.Alert).order_by(orm_models.Alert.timestamp.desc()).limit(100).all()
    return alerts


@router.post("/alerts", response_model=AlertRead)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    m = db.query(orm_models.Machine).filter(orm_models.Machine.id == payload.machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")
    a = orm_models.Alert(machine_id=payload.machine_id, level=payload.level, message=payload.message)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.get("/analytics")
def analytics(db: Session = Depends(get_db)):
    # basic analytics
    from sqlalchemy import func

    avg_temp = db.query(func.avg(orm_models.SensorReading.temperature)).scalar() or 0
    avg_vib = db.query(func.avg(orm_models.SensorReading.vibration)).scalar() or 0
    avg_sound = db.query(func.avg(orm_models.SensorReading.sound)).scalar() or 0
    return {
        "avg_temperature": float(avg_temp),
        "avg_vibration": float(avg_vib),
        "avg_sound": float(avg_sound),
        "energy_trend": None,
        "failure_trend": None,
        "health_trend": None,
    }


@router.post("/retrain")
def retrain(db: Session = Depends(get_db)):
    # Collect labeled data
    import pandas as pd
    from app.core.config import settings

    readings = db.query(orm_models.SensorReading).all()
    if len(readings) < 50:
        raise HTTPException(status_code=400, detail="Not enough data to retrain")
    rows = []
    for r in readings:
        label = (r.raw.get("health") if r.raw else None) or 80
        rows.append({
            "temperature": r.temperature,
            "vibration": r.vibration,
            "sound": r.sound,
            "health": label,
        })
    df = pd.DataFrame(rows)
    from app.ml.pipeline import ModelManager

    mm = ModelManager(model_name=settings.model_name, model_type=settings.model_type)
    res = mm.train(df, target_col="health")

    # persist model info
    mi = orm_models.ModelInfo(
        name=settings.model_name,
        version=res.get("version", "v0"),
        type=res.get("type", settings.model_type),
        metadata_json={"cv_mean_r2": res.get("cv_mean_r2")},
    )
    db.add(mi)
    db.commit()
    db.refresh(mi)
    return {"result": res, "model_info_id": mi.id}


@router.get("/model-info", response_model=ModelInfoSchema)
def model_info(db: Session = Depends(get_db)):
    m = db.query(orm_models.ModelInfo).order_by(orm_models.ModelInfo.created_at.desc()).first()
    if not m:
        return {"name": "rf_model", "version": "v0", "type": "random_forest", "metadata": {}}
    return {"name": m.name, "version": m.version, "type": m.type, "metadata": m.metadata_json or {}}


@router.get("/models")
def list_models(db: Session = Depends(get_db)):
    items = db.query(orm_models.ModelInfo).order_by(orm_models.ModelInfo.created_at.desc()).limit(20).all()
    return [{"id": it.id, "name": it.name, "version": it.version, "type": it.type, "metadata": it.metadata_json} for it in items]


@router.get("/models/compare")
def compare_models(db: Session = Depends(get_db)):
    """Train and compare RandomForest and XGBoost on available labeled data and return CV scores."""
    import pandas as pd
    from sklearn.ensemble import RandomForestRegressor
    try:
        from xgboost import XGBRegressor
    except Exception:
        XGBRegressor = None
    from sklearn.model_selection import cross_val_score

    readings = db.query(orm_models.SensorReading).all()
    if len(readings) < 30:
        raise HTTPException(status_code=400, detail="Not enough data to compare models")
    rows = []
    for r in readings:
        label = (r.raw.get("health") if r.raw else None) or 80
        rows.append({
            "temperature": r.temperature,
            "vibration": r.vibration,
            "sound": r.sound,
            "health": label,
        })
    df = pd.DataFrame(rows)
    X = df[["temperature", "vibration", "sound"]]
    y = df["health"]

    results = {}
    rf = RandomForestRegressor(n_estimators=50, random_state=42)
    rf_scores = cross_val_score(rf, X, y, cv=3, scoring="r2")
    results["random_forest"] = {"cv_mean_r2": float(rf_scores.mean())}
    if XGBRegressor is not None:
        xgb = XGBRegressor(n_estimators=50, random_state=42, verbosity=0)
        xgb_scores = cross_val_score(xgb, X, y, cv=3, scoring="r2")
        results["xgboost"] = {"cv_mean_r2": float(xgb_scores.mean())}
    else:
        results["xgboost"] = {"available": False}

    return results
