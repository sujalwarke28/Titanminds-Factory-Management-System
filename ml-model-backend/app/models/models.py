from __future__ import annotations
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base
import datetime


class Machine(Base):
    __tablename__ = "machines"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    location = Column(String, nullable=True)
    meta = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    readings = relationship("SensorReading", back_populates="machine")
    predictions = relationship("Prediction", back_populates="machine")


class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), index=True)
    temperature = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    sound = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    raw = Column(JSON, default={})

    machine = relationship("Machine", back_populates="readings")


class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    health_score = Column(Float)
    failure_probability = Column(Float)
    risk_level = Column(String)
    anomaly_score = Column(Float)
    confidence = Column(Float)
    recommendation = Column(String)
    explanation = Column(JSON, default=[])
    root_cause = Column(String, nullable=True)
    model_version = Column(String, nullable=True)

    machine = relationship("Machine", back_populates="predictions")


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    level = Column(String)
    message = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    acknowledged = Column(Boolean, default=False)


class MaintenanceHistory(Base):
    __tablename__ = "maintenance_history"
    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    performed_at = Column(DateTime, default=datetime.datetime.utcnow)
    action = Column(String)
    notes = Column(String, nullable=True)


class ModelInfo(Base):
    __tablename__ = "model_info"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    version = Column(String)
    type = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    metadata_json = Column(JSON, default={})
