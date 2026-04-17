from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer

from train_utils import train_and_save_model

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "processed" / "sms_processed.csv"
MODEL_DIR = BASE_DIR / "ml"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def main() -> None:
    train_and_save_model(
        dataset_name="sms",
        data_path=DATA_PATH,
        model_path=MODEL_DIR / "sms_model.pkl",
        vectorizer_path=MODEL_DIR / "sms_vectorizer.pkl",
        vectorizer=TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
        ),
    )


if __name__ == "__main__":
    main()
