from __future__ import annotations
from typing import Dict, Any, List
from datetime import datetime
import pandas as pd
from app.ml.pipeline import ModelManager
from app.database.session import SessionLocal
from app.models import models as orm_models
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


def build_or_get_machine(payload, db: Session) -> orm_models.Machine:
    machine = db.query(orm_models.Machine).filter(orm_models.Machine.name == payload.machine_id).first()
    if not machine:
        machine = orm_models.Machine(name=payload.machine_id)
        db.add(machine)
        db.commit()
        db.refresh(machine)
    return machine


def create_sensor_reading(payload, db: Session, machine: orm_models.Machine) -> orm_models.SensorReading:
    reading = orm_models.SensorReading(
        machine_id=machine.id,
        temperature=payload.temperature,
        vibration=payload.vibration,
        sound=payload.sound,
        timestamp=payload.timestamp,
        raw=payload.dict(),
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


def build_features_from_readings(readings: List[orm_models.SensorReading]) -> pd.DataFrame:
    # readings is a list ordered by timestamp ascending
    df = pd.DataFrame([{
        "temperature": r.temperature,
        "vibration": r.vibration,
        "sound": r.sound,
        "timestamp": r.timestamp,
    } for r in readings])
    if df.empty:
        return df
    df = df.set_index("timestamp").sort_index()
    # rolling features
    df["temp_ma_3"] = df["temperature"].rolling(3, min_periods=1).mean()
    df["vib_ma_3"] = df["vibration"].rolling(3, min_periods=1).mean()
    df["sound_ma_3"] = df["sound"].rolling(3, min_periods=1).mean()
    df["temp_std_3"] = df["temperature"].rolling(3, min_periods=1).std().fillna(0)
    # rate of change
    df["temp_roc"] = df["temperature"].pct_change().fillna(0)
    df["vib_roc"] = df["vibration"].pct_change().fillna(0)
    df["sound_roc"] = df["sound"].pct_change().fillna(0)
    # trend: linear slope approximated by diff
    df["temp_trend"] = df["temperature"].diff().fillna(0)
    # select last row features for prediction
    last = df.iloc[-1:]
    return last.drop(columns=[])


def heuristic_health_score(row: pd.Series) -> float:
    # Combine normalized features into a health score 0-100
    temp = row.get("temperature", 0)
    vib = row.get("vibration", 0)
    sound = row.get("sound", 0)
    # realistic thresholds
    temp_penalty = max(0, (temp - 35) * 2)
    vib_penalty = max(0, (vib - 0.2) * 200)
    sound_penalty = max(0, (sound - 60) * 0.5)
    base = 100 - (temp_penalty + vib_penalty + sound_penalty)
    return float(max(0, min(100, base)))


def predict_for_machine(machine_id: int, db: Session) -> Dict[str, Any]:
    readings = db.query(orm_models.SensorReading).filter(orm_models.SensorReading.machine_id == machine_id).order_by(orm_models.SensorReading.timestamp).all()
    if not readings:
        raise ValueError("No readings for machine")
    X = build_features_from_readings(readings)
    mm = ModelManager()
    try:
        preds = mm.predict(X)
        explanations = mm.explain(X)
    except Exception:
        # fallback to heuristic
        last_row = X.iloc[0] if not X.empty else readings[-1]
        health = heuristic_health_score(last_row)
        preds = {
            "health_score": [health],
            "failure_probability": [1 - health / 100],
            "anomaly_score": [0.0],
            "confidence": [0.5],
            "model_version": "heuristic",
        }
        explanations = {0: ["Heuristic score based on temperature/vibration/sound"]}

    hs = preds["health_score"][0]
    failure_prob = preds["failure_probability"][0]
    anomaly = preds["anomaly_score"][0]
    conf = preds["confidence"][0]
    if hs > 80:
        risk = "Healthy"
    elif hs > 50:
        risk = "Warning"
    else:
        risk = "Critical"

    reasons = explanations.get(0, []) if isinstance(explanations, dict) else []

    recommendation = "Continue Monitoring"
    if risk == "Warning":
        recommendation = "Inspect Spindle / Lubricate Axis"
    if risk == "Critical":
        recommendation = "Stop Machine / Inspect Motor"

    result = {
        "machine_id": db.query(orm_models.Machine).get(machine_id).name,
        "health_score": float(hs),
        "failure_probability": float(failure_prob),
        "risk": risk,
        "anomaly_score": float(anomaly),
        "confidence": float(conf),
        "recommendation": recommendation,
        "explanation": reasons,
        "timestamp": readings[-1].timestamp,
    }

    # persist prediction
    pred = orm_models.Prediction(
        machine_id=machine_id,
        health_score=result["health_score"],
        failure_probability=result["failure_probability"],
        risk_level=result["risk"],
        anomaly_score=result["anomaly_score"],
        confidence=result["confidence"],
        recommendation=result["recommendation"],
        explanation=result["explanation"],
        model_version=preds.get("model_version", "unknown"),
    )
    db.add(pred)
    db.commit()
    db.refresh(pred)
    return result


def predict_from_payload(payload, db: Session) -> Dict[str, Any]:
    machine = build_or_get_machine(payload, db)
    create_sensor_reading(payload, db, machine)
    return predict_for_machine(machine.id, db)
