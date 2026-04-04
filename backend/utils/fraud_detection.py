from pathlib import Path

import joblib

MODEL_PATH = Path(__file__).resolve().parents[2] / "ml_model" / "model.pkl"


def _load_model():
    if MODEL_PATH.exists() and MODEL_PATH.stat().st_size > 0:
        return joblib.load(MODEL_PATH)
    return None


def score_transaction_risk(transaction: dict) -> str:
    model = _load_model()
    if model is not None:
        features = [[transaction.get("amount", 0)]]
        prediction = model.predict(features)[0]
        return "HIGH" if int(prediction) == 1 else "LOW"

    amount = float(transaction.get("amount", 0))
    if amount >= 5000:
        return "HIGH"
    if amount >= 1500:
        return "MEDIUM"
    return "LOW"
