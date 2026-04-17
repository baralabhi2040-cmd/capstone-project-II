from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer

from train_utils import train_and_save_model

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "processed" / "urls_processed.csv"
MODEL_DIR = BASE_DIR / "ml"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def main() -> None:
    train_and_save_model(
        dataset_name="url",
        data_path=DATA_PATH,
        model_path=MODEL_DIR / "url_model.pkl",
        vectorizer_path=MODEL_DIR / "url_vectorizer.pkl",
        vectorizer=TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5)),
    )


if __name__ == "__main__":
    main()
