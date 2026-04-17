from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split

from train_utils import load_training_frame

BASE_DIR = Path(__file__).resolve().parents[1]
REPORTS_DIR = BASE_DIR / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

LABEL_ORDER = ["legitimate", "phishing"]

MODEL_CONFIGS = [
    {
        "name": "email",
        "dataset_path": BASE_DIR / "data" / "processed" / "emails_processed.csv",
        "model_path": BASE_DIR / "ml" / "email_model.pkl",
        "vectorizer_path": BASE_DIR / "ml" / "email_vectorizer.pkl",
    },
    {
        "name": "sms",
        "dataset_path": BASE_DIR / "data" / "processed" / "sms_processed.csv",
        "model_path": BASE_DIR / "ml" / "sms_model.pkl",
        "vectorizer_path": BASE_DIR / "ml" / "sms_vectorizer.pkl",
    },
    {
        "name": "social",
        "dataset_path": BASE_DIR / "data" / "processed" / "social_processed.csv",
        "model_path": BASE_DIR / "ml" / "social_model.pkl",
        "vectorizer_path": BASE_DIR / "ml" / "social_vectorizer.pkl",
    },
    {
        "name": "url",
        "dataset_path": BASE_DIR / "data" / "processed" / "urls_processed.csv",
        "model_path": BASE_DIR / "ml" / "url_model.pkl",
        "vectorizer_path": BASE_DIR / "ml" / "url_vectorizer.pkl",
    },
]


def evaluate_model(config: dict) -> dict:
    dataset_name = config["name"]
    df = load_training_frame(config["dataset_path"], dataset_name=dataset_name)

    _, x_test, _, y_test = train_test_split(
        df["text"],
        df["label"],
        test_size=0.2,
        random_state=42,
        stratify=df["label"],
    )

    model = joblib.load(config["model_path"])
    vectorizer = joblib.load(config["vectorizer_path"])
    x_test_vec = vectorizer.transform(x_test)

    predictions = model.predict(x_test_vec)
    report = classification_report(
        y_test,
        predictions,
        labels=LABEL_ORDER,
        output_dict=True,
        zero_division=0,
    )
    matrix = confusion_matrix(y_test, predictions, labels=LABEL_ORDER)

    metrics = {
        "accuracy": round(report["accuracy"], 4),
        "macro_precision": round(report["macro avg"]["precision"], 4),
        "macro_recall": round(report["macro avg"]["recall"], 4),
        "macro_f1": round(report["macro avg"]["f1-score"], 4),
        "weighted_f1": round(report["weighted avg"]["f1-score"], 4),
    }

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(x_test_vec)
        classes = list(model.classes_)
        if "phishing" in classes:
            phishing_probs = probabilities[:, classes.index("phishing")]
            binary_truth = (y_test == "phishing").astype(int)
            metrics["roc_auc"] = round(float(roc_auc_score(binary_truth, phishing_probs)), 4)

    return {
        "dataset_rows": int(len(df)),
        "label_distribution": {
            label: int(count) for label, count in df["label"].value_counts().to_dict().items()
        },
        "test_rows": int(len(y_test)),
        "metrics": metrics,
        "per_class": {
            label: {
                "precision": round(report[label]["precision"], 4),
                "recall": round(report[label]["recall"], 4),
                "f1_score": round(report[label]["f1-score"], 4),
                "support": int(report[label]["support"]),
            }
            for label in LABEL_ORDER
        },
        "confusion_matrix": {
            "labels": LABEL_ORDER,
            "values": matrix.tolist(),
        },
        "artifacts": {
            "model_path": str(config["model_path"]),
            "vectorizer_path": str(config["vectorizer_path"]),
            "dataset_path": str(config["dataset_path"]),
        },
    }


def build_markdown(report: dict) -> str:
    lines = [
        "# Model Evaluation Report",
        "",
        f"Generated: {report['generated_at_utc']}",
        "",
        "This report evaluates the saved phishing-detection models on the deterministic holdout split",
        "created with `test_size=0.2`, `random_state=42`, and stratified labels.",
        "",
    ]

    for model_name, details in report["models"].items():
        metrics = details["metrics"]
        lines.extend(
            [
                f"## {model_name.upper()}",
                "",
                f"- Dataset rows: {details['dataset_rows']}",
                f"- Test rows: {details['test_rows']}",
                f"- Label distribution: {details['label_distribution']}",
                f"- Accuracy: {metrics['accuracy']}",
                f"- Macro F1: {metrics['macro_f1']}",
                f"- Weighted F1: {metrics['weighted_f1']}",
                f"- Macro recall: {metrics['macro_recall']}",
                f"- ROC AUC: {metrics.get('roc_auc', 'n/a')}",
                "",
                "| Class | Precision | Recall | F1 | Support |",
                "| --- | ---: | ---: | ---: | ---: |",
            ]
        )

        for label, class_metrics in details["per_class"].items():
            lines.append(
                f"| {label} | {class_metrics['precision']} | {class_metrics['recall']} | "
                f"{class_metrics['f1_score']} | {class_metrics['support']} |"
            )

        matrix = details["confusion_matrix"]["values"]
        lines.extend(
            [
                "",
                "Confusion matrix (`true x predicted` with labels `legitimate`, `phishing`):",
                "",
                f"`{matrix}`",
                "",
            ]
        )

    return "\n".join(lines).strip() + "\n"


def main() -> None:
    report = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "models": {},
    }

    for config in MODEL_CONFIGS:
        report["models"][config["name"]] = evaluate_model(config)

    json_path = REPORTS_DIR / "model_evaluation_report.json"
    markdown_path = REPORTS_DIR / "model_evaluation_report.md"

    json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    markdown_path.write_text(build_markdown(report), encoding="utf-8")

    print(f"Saved evaluation JSON report to {json_path}")
    print(f"Saved evaluation Markdown report to {markdown_path}")


if __name__ == "__main__":
    main()
