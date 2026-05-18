from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "dataset.csv"
MODEL_PATH = BASE_DIR / "model.pkl"


def train() -> None:
    data = pd.read_csv(DATA_PATH)
    x = data[["amount"]]
    y = data["is_fraud"]

    model = RandomForestClassifier(n_estimators=50, random_state=42)
    model.fit(x, y)
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    train()
