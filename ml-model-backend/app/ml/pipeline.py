from __future__ import annotations
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from typing import Dict, Any, Optional
from app.core.config import settings
import shap
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ModelManager:
    """Manage training, saving, loading, and inference for multiple model types.

    Supports: random_forest, xgboost (if available). Uses IsolationForest/OneClassSVM for anomaly detection.
    """

    def __init__(self, model_dir: str = settings.model_dir, model_name: str = settings.model_name, model_type: str = settings.model_type):
        self.model_dir = model_dir
        os.makedirs(self.model_dir, exist_ok=True)
        self.model_name = model_name
        self.model_path = os.path.join(model_dir, model_name)
        self.scaler = StandardScaler()
        self.model: Optional[Any] = None
        self.version = "v0"
        self.model_type = model_type

    def _get_base_model(self):
        if self.model_type == "xgboost":
            try:
                from xgboost import XGBRegressor

                return XGBRegressor(n_estimators=100, random_state=42, verbosity=0)
            except Exception:
                logger.warning("XGBoost not available, falling back to RandomForest")
        return RandomForestRegressor(n_estimators=100, random_state=42)

    def _build_pipeline(self):
        model = self._get_base_model()
        pipeline = Pipeline([("scaler", self.scaler), ("model", model)])
        return pipeline

    def _make_version(self) -> str:
        return datetime.utcnow().strftime("v%Y%m%d%H%M%S")

    def train(self, df: pd.DataFrame, target_col: str = "health") -> Dict[str, Any]:
        if df.shape[0] < settings.train_min_samples:
            raise ValueError("Not enough samples to train")
        X = df.drop(columns=[target_col])
        y = df[target_col]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        pipeline = self._build_pipeline()
        pipeline.fit(X_train, y_train)
        self.model = pipeline
        self.version = self._make_version()
        scores = cross_val_score(pipeline, X_train, y_train, cv=3, scoring="r2")
        save_payload = {"model": pipeline, "version": self.version, "type": self.model_type}
        joblib.dump(save_payload, self.model_path)
        logger.info("Model trained and saved to %s", self.model_path)
        return {"cv_mean_r2": float(scores.mean()), "version": self.version, "type": self.model_type}

    def load(self):
        if os.path.exists(self.model_path):
            data = joblib.load(self.model_path)
            self.model = data.get("model")
            self.version = data.get("version", "v0")
            self.model_type = data.get("type", self.model_type)
            logger.info("Loaded model version %s (%s)", self.version, self.model_type)
            return True
        return False

    def predict(self, X: pd.DataFrame) -> Dict[str, Any]:
        if self.model is None:
            self.load()
        if self.model is None:
            raise RuntimeError("Model not available")
        # Ensure shape
        X_in = X.copy()
        X_scaled = self.model.named_steps["scaler"].transform(X_in)
        # Prediction
        preds = self.model.named_steps["model"].predict(X_in if hasattr(self.model.named_steps["model"], "predict") else X_scaled)
        preds = np.array(preds, dtype=float)
        # Normalize/clip to 0-100
        health_scores = np.clip(preds, 0, 100)

        # Confidence estimation: try to use ensemble spread
        conf = np.full(len(health_scores), 0.8)
        try:
            ests = getattr(self.model.named_steps["model"], "estimators_")
            per_tree = np.vstack([e.predict(X_in) for e in ests])
            stds = np.std(per_tree, axis=0)
            conf = 1 - (stds / (np.abs(health_scores) + 1e-6))
            conf = np.clip(conf, 0.2, 0.99)
        except Exception:
            pass

        # anomaly detection
        iso = IsolationForest(contamination=0.01, random_state=42)
        try:
            iso.fit(X_in)
            anomaly_scores = -iso.decision_function(X_in)
        except Exception:
            anomaly_scores = np.zeros(len(health_scores))

        return {
            "health_score": health_scores.tolist(),
            "failure_probability": (1 - health_scores / 100).tolist(),
            "anomaly_score": anomaly_scores.tolist(),
            "confidence": conf.tolist() if isinstance(conf, np.ndarray) else [float(conf)] * len(health_scores),
            "model_version": self.version,
        }

    def explain(self, X: pd.DataFrame, top_n: int = 3) -> Dict[int, Any]:
        if self.model is None:
            self.load()
        if self.model is None:
            return {}
        # Use scaled input for explainer background
        X_in = X.copy()
        try:
            X_scaled = self.model.named_steps["scaler"].transform(X_in)
            explainer = shap.Explainer(self.model.named_steps["model"], X_scaled)
            shap_values = explainer(X_scaled)
            reasons = {}
            for i, sv in enumerate(shap_values.values):
                idxs = np.argsort(-np.abs(sv))[:top_n]
                feats = [X_in.columns[j] for j in idxs]
                reasons[i] = feats
            return reasons
        except Exception as e:
            logger.exception("SHAP explanation failed: %s", e)
            return {i: ["Explanation unavailable"] for i in range(len(X_in))}

