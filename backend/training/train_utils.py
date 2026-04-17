from pathlib import Path

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

MIN_SAMPLES_PER_CLASS = 25
EXPECTED_LABELS = {"legitimate", "phishing"}


def load_training_frame(
    data_path: Path,
    *,
    dataset_name: str,
    min_samples_per_class: int = MIN_SAMPLES_PER_CLASS,
) -> pd.DataFrame:
    if not data_path.exists():
        raise FileNotFoundError(f"{dataset_name} dataset not found: {data_path}")

    df = pd.read_csv(data_path).dropna(subset=["text", "label"]).copy()
    df["text"] = df["text"].astype(str).str.strip()
    df["label"] = df["label"].astype(str).str.strip().str.lower()
    df = df[df["text"].str.len() > 0].reset_index(drop=True)

    if df.empty:
        raise ValueError(f"{dataset_name} dataset is empty after cleaning.")

    labels = set(df["label"].unique())
    unexpected_labels = labels - EXPECTED_LABELS
    missing_labels = EXPECTED_LABELS - labels

    if missing_labels:
        raise ValueError(
            f"{dataset_name} dataset must contain both phishing and legitimate labels. "
            f"Missing: {', '.join(sorted(missing_labels))}."
        )

    if unexpected_labels:
        raise ValueError(
            f"{dataset_name} dataset contains unexpected labels: "
            f"{', '.join(sorted(unexpected_labels))}."
        )

    counts = df["label"].value_counts()
    if int(counts.min()) < min_samples_per_class:
        raise ValueError(
            f"{dataset_name} dataset needs at least {min_samples_per_class} samples per class. "
            f"Current counts: {counts.to_dict()}."
        )

    return df


def train_and_save_model(
    *,
    dataset_name: str,
    data_path: Path,
    model_path: Path,
    vectorizer_path: Path,
    vectorizer,
    min_samples_per_class: int = MIN_SAMPLES_PER_CLASS,
) -> None:
    df = load_training_frame(
        data_path,
        dataset_name=dataset_name,
        min_samples_per_class=min_samples_per_class,
    )
    counts = df["label"].value_counts().to_dict()
    print(f"{dataset_name} label distribution: {counts}")

    x_train, x_test, y_train, y_test = train_test_split(
        df["text"],
        df["label"],
        test_size=0.2,
        random_state=42,
        stratify=df["label"],
    )

    x_train_vec = vectorizer.fit_transform(x_train)
    x_test_vec = vectorizer.transform(x_test)

    model = LogisticRegression(max_iter=1000, class_weight="balanced")
    model.fit(x_train_vec, y_train)

    preds = model.predict(x_test_vec)
    print(classification_report(y_test, preds, digits=4, zero_division=0))

    joblib.dump(model, model_path)
    joblib.dump(vectorizer, vectorizer_path)
    print(f"Saved {model_path.name} and {vectorizer_path.name}")
