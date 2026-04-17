from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
EMAIL_DATASET_CANDIDATES = [
    RAW_DIR / "phishing_emails_labeled.csv",
    RAW_DIR / "phishing_emails.csv",
]

COMMON_PHISHING_LABELS = {"spam", "phishing", "1", "bad", "malicious"}
COMMON_LEGITIMATE_LABELS = {"ham", "legitimate", "0", "benign", "good"}
URL_PHISHING_LABELS = {"0", "-1", "phishing", "bad", "malicious"}
URL_LEGITIMATE_LABELS = {"1", "legitimate", "benign", "good"}


def save_df(df: pd.DataFrame, filename: str) -> None:
    out_path = PROCESSED_DIR / filename
    df.to_csv(out_path, index=False)
    print(f"Saved: {out_path}")


def normalize_label(
    value: object,
    *,
    phishing_tokens: set[str] = COMMON_PHISHING_LABELS,
    legitimate_tokens: set[str] = COMMON_LEGITIMATE_LABELS,
) -> str:
    label = str(value).strip().lower()
    if label in phishing_tokens:
        return "phishing"
    if label in legitimate_tokens:
        return "legitimate"
    return label


def build_email_frame(df: pd.DataFrame) -> pd.DataFrame:
    label_col = next(
        (column for column in ("label", "class", "category", "target") if column in df.columns),
        None,
    )

    if label_col is None:
        raise ValueError(
            "phishing_emails.csv does not include a label column. The current raw email file is an "
            "unlabeled legitimate-email corpus, so it cannot produce a reliable phishing model."
        )

    sender = (
        df["sender"].astype(str).fillna("").str.strip()
        if "sender" in df.columns
        else pd.Series([""] * len(df), index=df.index)
    )
    subject = (
        df["subject"].astype(str).fillna("").str.strip()
        if "subject" in df.columns
        else pd.Series([""] * len(df), index=df.index)
    )
    body = (
        df["body"].astype(str).fillna("").str.strip()
        if "body" in df.columns
        else pd.Series([""] * len(df), index=df.index)
    )

    if "text" in df.columns:
        text = df["text"].astype(str).str.strip()
    elif "message" in df.columns and "body" not in df.columns:
        text = df["message"].astype(str).str.strip()
    elif "content" in df.columns:
        text = df["content"].astype(str).str.strip()
    elif "body" in df.columns or "subject" in df.columns:
        text = (subject + " " + body).str.strip()
    else:
        raise ValueError(
            "phishing_emails.csv must include either 'text' or structured email columns such as "
            "'subject' and 'body'."
        )

    out = pd.DataFrame({
        "sender": sender,
        "subject": subject,
        "body": body,
        "text": text,
        "label": df[label_col].apply(normalize_label),
        "channel": "email",
        "platform": "",
        "source": "email_dataset",
    })

    if "channel" in df.columns:
        out["channel"] = df["channel"].astype(str).str.strip()
    if "platform" in df.columns:
        out["platform"] = df["platform"].astype(str).fillna("").str.strip()
    if "source" in df.columns:
        out["source"] = df["source"].astype(str).str.strip()

    return out


def get_email_dataset_path() -> Path:
    for candidate in EMAIL_DATASET_CANDIDATES:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(
        "Could not find any raw email dataset. Expected one of: "
        + ", ".join(str(path.name) for path in EMAIL_DATASET_CANDIDATES)
    )


def prepare_sms():
    path = RAW_DIR / "phishing_sms.csv"
    df = pd.read_csv(path, encoding="latin1")

    # Common SMS spam dataset format: v1=label, v2=text
    if "v1" in df.columns and "v2" in df.columns:
        out = pd.DataFrame({
            "text": df["v2"].astype(str).str.strip(),
            "label": df["v1"].apply(normalize_label),
            "channel": "sms",
            "platform": "",
            "source": "sms_dataset"
        })
    else:
        # fallback if already simplified
        text_col = "text" if "text" in df.columns else df.columns[1]
        label_col = "label" if "label" in df.columns else df.columns[0]
        out = pd.DataFrame({
            "text": df[text_col].astype(str).str.strip(),
            "label": df[label_col].apply(normalize_label),
            "channel": "sms",
            "platform": "",
            "source": "sms_dataset"
        })

    out = out.dropna(subset=["text", "label"])
    out = out[out["text"].str.len() > 0]
    out = out.drop_duplicates().reset_index(drop=True)

    save_df(out, "sms_processed.csv")


def prepare_social():
    path = RAW_DIR / "phishing_social.csv"
    df = pd.read_csv(path)

    # Expected combined file format: text,label,channel,platform,source
    if {"text", "label"}.issubset(df.columns):
        out = df.copy()
        if "channel" not in out.columns:
            out["channel"] = "social"
        if "platform" not in out.columns:
            out["platform"] = "youtube"
        if "source" not in out.columns:
            out["source"] = "social_dataset"
    else:
        # fallback for YouTube format
        text_col = "CONTENT" if "CONTENT" in df.columns else df.columns[0]
        label_col = "CLASS" if "CLASS" in df.columns else df.columns[1]
        out = pd.DataFrame({
            "text": df[text_col].astype(str).str.strip(),
            "label": df[label_col].apply(lambda x: "phishing" if int(x) == 1 else "legitimate"),
            "channel": "social",
            "platform": "youtube",
            "source": "social_dataset"
        })

    out["label"] = out["label"].apply(normalize_label)
    out = out.dropna(subset=["text", "label"])
    out = out[out["text"].str.len() > 0]
    out = out.drop_duplicates().reset_index(drop=True)

    save_df(out, "social_processed.csv")


def prepare_emails():
    path = get_email_dataset_path()
    df = pd.read_csv(path)
    out = build_email_frame(df)
    out = out.dropna(subset=["text", "label"])
    out = out[out["text"].str.len() > 0]
    out = out.drop_duplicates().reset_index(drop=True)

    save_df(out, "emails_processed.csv")


def prepare_urls():
    path = RAW_DIR / "phishing_urls.csv"
    df = pd.read_csv(path)

    # If URL dataset contains URL + label columns
    url_col = None
    for candidate in ["URL", "url", "text"]:
        if candidate in df.columns:
            url_col = candidate
            break

    if url_col is None:
        raise ValueError("Could not find URL column in phishing_urls.csv")

    if "label" not in df.columns:
        raise ValueError("Could not find label column in phishing_urls.csv")

    out = pd.DataFrame({
        "text": df[url_col].astype(str).str.strip(),
        # The bundled raw URL dataset uses 1=legitimate and 0=phishing.
        "label": df["label"].apply(
            lambda value: normalize_label(
                value,
                phishing_tokens=URL_PHISHING_LABELS,
                legitimate_tokens=URL_LEGITIMATE_LABELS,
            )
        ),
        "channel": "url",
        "platform": "",
        "source": "url_dataset"
    })

    out = out.dropna(subset=["text", "label"])
    out = out[out["text"].str.len() > 0]
    out = out.drop_duplicates().reset_index(drop=True)

    save_df(out, "urls_processed.csv")


def run_all() -> None:
    failures: list[str] = []
    for name, func in (
        ("email", prepare_emails),
        ("sms", prepare_sms),
        ("social", prepare_social),
        ("url", prepare_urls),
    ):
        try:
            func()
        except Exception as exc:
            failures.append(f"{name}: {exc}")
            print(f"Failed to prepare {name} dataset: {exc}")

    if failures:
        raise SystemExit(
            "Dataset preparation completed with errors:\n- " + "\n- ".join(failures)
        )

    print("All processed datasets created successfully.")


if __name__ == "__main__":
    run_all()
