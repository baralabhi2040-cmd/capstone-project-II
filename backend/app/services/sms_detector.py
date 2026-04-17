import re
from pathlib import Path

from app.services.model_guard import load_model_assets
from app.services.threat_score import (
    build_rule_indicator,
    build_scan_response,
    extract_ml_signal,
)
from app.utils.feature_extractor import contains_shortened_url, find_urls, keyword_hits

SMS_KEYWORDS = {
    "parcel",
    "delivery",
    "bank",
    "otp",
    "account suspended",
    "verify",
    "claim",
    "prize",
    "winner",
    "won",
    "congratulations",
    "reward",
    "lottery",
    "jackpot",
    "click",
    "urgent",
    "payment",
    "security code",
    "selected",
    "limited offer",
    "final notice",
}
MONEY_AMOUNT_PATTERN = re.compile(
    r"\b\d+\s*(?:m|million|k|thousand|lakh|crore)\b",
    re.IGNORECASE,
)

ML_DIR = Path(__file__).resolve().parents[2] / "ml"
DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "processed" / "sms_processed.csv"
MODEL_PATH = ML_DIR / "sms_model.pkl"
VECTORIZER_PATH = ML_DIR / "sms_vectorizer.pkl"


def detect_sms(sender: str, message: str) -> dict:
    rule_indicators: list[dict] = []
    text = message.lower().strip()
    sms_model, sms_vectorizer = load_model_assets(
        str(DATA_PATH),
        str(MODEL_PATH),
        str(VECTORIZER_PATH),
    )
    ml_signal = None

    if sms_model is not None and sms_vectorizer is not None:
        vector = sms_vectorizer.transform([message])
        ml_signal = extract_ml_signal(sms_model, vector, channel_name="SMS")

    hits = keyword_hits(text, SMS_KEYWORDS)
    if hits:
        rule_indicators.append(
            build_rule_indicator(
                title="Suspicious SMS keywords",
                detail=f"Suspicious SMS keywords detected: {', '.join(hits[:8])}",
                impact=25,
            )
        )

    if find_urls(message):
        rule_indicators.append(
            build_rule_indicator(
                title="Contains link",
                detail="SMS contains a clickable link.",
                impact=25,
            )
        )

    if contains_shortened_url(message):
        rule_indicators.append(
            build_rule_indicator(
                title="Shortened URL detected",
                detail="SMS contains a shortened URL.",
                impact=25,
            )
        )

    if any(token in text for token in {"urgent", "immediately", "final notice", "last chance"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Urgency language",
                detail="SMS uses urgency or fear language.",
                impact=20,
            )
        )

    if any(token in text for token in {"bank", "security code", "otp", "account suspended"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Sensitive account wording",
                detail="SMS references banking, account access, or verification details.",
                impact=25,
            )
        )

    if any(token in text for token in {"congratulations", "won", "prize", "lottery", "jackpot", "reward"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Prize-scam language",
                detail="SMS contains prize or lottery scam language.",
                impact=25,
            )
        )

    if any(token in text for token in {"claim now", "claim your reward", "selected", "winner"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Winner-style framing",
                detail="SMS uses giveaway or winner-style scam wording.",
                impact=20,
            )
        )

    if any(token in text for token in {"you have won", "you've won", "free money", "don't have to work", "become rich"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Too-good-to-be-true promise",
                detail="SMS makes unrealistic reward or effortless-money promises often used in scams.",
                impact=20,
            )
        )

    normalized_sender = sender.strip()
    if normalized_sender.isdigit() and len(normalized_sender) < 5:
        rule_indicators.append(
            build_rule_indicator(
                title="Bulk sender pattern",
                detail="Short sender ID may indicate a bulk SMS campaign.",
                impact=15,
            )
        )

    if "$" in message or "million" in text or "cash" in text or MONEY_AMOUNT_PATTERN.search(message):
        rule_indicators.append(
            build_rule_indicator(
                title="Large reward mention",
                detail="SMS mentions unusually large money or reward amounts.",
                impact=20,
            )
        )

    return build_scan_response(
        channel="sms",
        rule_indicators=rule_indicators,
        ml_signal=ml_signal,
    )
