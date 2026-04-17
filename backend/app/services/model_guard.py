import os
import time
from pathlib import Path
from threading import Lock, Thread
from typing import Any

from app.utils.logger import logger

MIN_SAMPLES_PER_CLASS = 25
CacheKey = tuple[str, str, str]

_ASSET_CACHE: dict[CacheKey, tuple[Any | None, Any | None]] = {}
_ASSET_LOADING: set[CacheKey] = set()
_ASSET_LOCK = Lock()


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() not in {"0", "false", "no", "off"}


def _cache_key(
    data_path_str: str,
    model_path_str: str,
    vectorizer_path_str: str,
) -> CacheKey:
    return (
        Path(data_path_str).resolve(strict=False).as_posix(),
        Path(model_path_str).resolve(strict=False).as_posix(),
        Path(vectorizer_path_str).resolve(strict=False).as_posix(),
    )


def should_enable_ml(data_path: Path, *, min_samples_per_class: int = MIN_SAMPLES_PER_CLASS) -> bool:
    if not data_path.exists():
        return False

    try:
        import pandas as pd

        labels = pd.read_csv(data_path, usecols=["label"])["label"].astype(str).str.strip().str.lower()
    except Exception:
        return False

    counts = labels.value_counts()
    return (
        counts.get("phishing", 0) >= min_samples_per_class
        and counts.get("legitimate", 0) >= min_samples_per_class
    )


def _load_model_assets_from_disk(
    data_path_str: str,
    model_path_str: str,
    vectorizer_path_str: str,
) -> tuple[Any | None, Any | None]:
    data_path = Path(data_path_str)
    model_path = Path(model_path_str)
    vectorizer_path = Path(vectorizer_path_str)

    if not model_path.exists() or not vectorizer_path.exists():
        logger.warning(
            "ML assets missing: model=%s vectorizer=%s",
            model_path,
            vectorizer_path,
        )
        return None, None

    if _as_bool(os.getenv("VALIDATE_ML_DATASET"), False) and not should_enable_ml(data_path):
        logger.warning("ML disabled because dataset validation failed for %s", data_path)
        return None, None

    import joblib

    start = time.perf_counter()
    try:
        model = joblib.load(model_path)
        vectorizer = joblib.load(vectorizer_path)
    except Exception as exc:
        logger.exception("ML asset load failed for %s: %s", model_path.name, exc)
        return None, None

    logger.info(
        "Loaded ML assets model=%s vectorizer=%s in %.2fs",
        model_path.name,
        vectorizer_path.name,
        time.perf_counter() - start,
    )
    return model, vectorizer


def load_model_assets(
    data_path_str: str,
    model_path_str: str,
    vectorizer_path_str: str,
) -> tuple[Any | None, Any | None]:
    key = _cache_key(data_path_str, model_path_str, vectorizer_path_str)
    with _ASSET_LOCK:
        if key in _ASSET_CACHE:
            return _ASSET_CACHE[key]

    assets = _load_model_assets_from_disk(
        data_path_str,
        model_path_str,
        vectorizer_path_str,
    )
    with _ASSET_LOCK:
        _ASSET_CACHE[key] = assets
        _ASSET_LOADING.discard(key)
    return assets


def warm_model_assets(
    data_path_str: str,
    model_path_str: str,
    vectorizer_path_str: str,
) -> None:
    key = _cache_key(data_path_str, model_path_str, vectorizer_path_str)
    with _ASSET_LOCK:
        if key in _ASSET_CACHE or key in _ASSET_LOADING:
            return
        _ASSET_LOADING.add(key)

    def _warm() -> None:
        load_model_assets(data_path_str, model_path_str, vectorizer_path_str)

    Thread(target=_warm, name=f"ml-warmup-{Path(model_path_str).stem}", daemon=True).start()


def get_model_assets_nonblocking(
    data_path_str: str,
    model_path_str: str,
    vectorizer_path_str: str,
) -> tuple[Any | None, Any | None]:
    key = _cache_key(data_path_str, model_path_str, vectorizer_path_str)
    with _ASSET_LOCK:
        cached = _ASSET_CACHE.get(key)

    if cached is not None:
        return cached

    warm_model_assets(data_path_str, model_path_str, vectorizer_path_str)
    return None, None
