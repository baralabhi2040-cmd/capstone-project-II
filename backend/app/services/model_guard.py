from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd

MIN_SAMPLES_PER_CLASS = 25


def should_enable_ml(data_path: Path, *, min_samples_per_class: int = MIN_SAMPLES_PER_CLASS) -> bool:
    if not data_path.exists():
        return False

    try:
        labels = pd.read_csv(data_path, usecols=["label"])["label"].astype(str).str.strip().str.lower()
    except Exception:
        return False

    counts = labels.value_counts()
    return (
        counts.get("phishing", 0) >= min_samples_per_class
        and counts.get("legitimate", 0) >= min_samples_per_class
    )


@lru_cache(maxsize=None)
def load_model_assets(
    data_path_str: str,
    model_path_str: str,
    vectorizer_path_str: str,
):
    data_path = Path(data_path_str)
    model_path = Path(model_path_str)
    vectorizer_path = Path(vectorizer_path_str)

    if not should_enable_ml(data_path):
        return None, None

    if not model_path.exists() or not vectorizer_path.exists():
        return None, None

    try:
        return joblib.load(model_path), joblib.load(vectorizer_path)
    except Exception:
        return None, None
