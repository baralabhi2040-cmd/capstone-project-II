from pathlib import Path

from app.services.model_guard import load_model_assets
from app.services.threat_score import (
    build_rule_indicator,
    build_scan_response,
    extract_ml_signal,
)
from app.utils.feature_extractor import contains_shortened_url, find_urls, keyword_hits

EMAIL_KEYWORDS = {
    "urgent",
    "verify",
    "password",
    "invoice",
    "payment",
    "suspended",
    "click here",
    "reset",
    "confirm",
    "login",
    "security alert",
    "bank",
    "gift card",
    "wire transfer",
    "account locked",
    "update account",
    "confirm identity",
    "unusual activity",
    "limited time",
    "failure notice",
    "action required",
}

IMPERSONATION_WORDS = {"bank", "paypal", "microsoft", "google", "apple", "ato", "netflix", "amazon"}
FREE_DOMAINS = {"gmail.com", "yahoo.com", "outlook.com", "hotmail.com"}

ML_DIR = Path(__file__).resolve().parents[2] / "ml"
DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "processed" / "emails_processed.csv"
MODEL_PATH = ML_DIR / "email_model.pkl"
VECTORIZER_PATH = ML_DIR / "email_vectorizer.pkl"


def detect_email(sender: str, subject: str, body: str) -> dict:
    rule_indicators: list[dict] = []
    email_model, email_vectorizer = load_model_assets(
        str(DATA_PATH),
        str(MODEL_PATH),
        str(VECTORIZER_PATH),
    )

    sender_lower = sender.lower().strip()
    subject_lower = subject.lower().strip()
    body_lower = body.lower().strip()
    text = f"{subject_lower} {body_lower}"
    ml_signal = None

    if email_model is not None and email_vectorizer is not None:
        vector = email_vectorizer.transform([f"{subject} {body}"])
        ml_signal = extract_ml_signal(email_model, vector, channel_name="email")

    hits = keyword_hits(text, EMAIL_KEYWORDS)
    if hits:
        rule_indicators.append(
            build_rule_indicator(
                title="Suspicious email keywords",
                detail=f"Suspicious email keywords detected: {', '.join(hits[:8])}",
                impact=25,
            )
        )

    urls = find_urls(body)
    if urls:
        rule_indicators.append(
            build_rule_indicator(
                title="Contains links",
                detail="Email contains one or more links.",
                impact=20,
            )
        )

    if contains_shortened_url(body):
        rule_indicators.append(
            build_rule_indicator(
                title="Shortened link detected",
                detail="Email contains a shortened link.",
                impact=20,
            )
        )

    if any(word in sender_lower for word in IMPERSONATION_WORDS) and any(domain in sender_lower for domain in FREE_DOMAINS):
        rule_indicators.append(
            build_rule_indicator(
                title="Possible sender impersonation",
                detail="Sender may be impersonating a trusted brand using a free email domain.",
                impact=30,
            )
        )

    if any(token in text for token in {"attachment", ".zip", ".exe", ".scr", ".html", ".docm"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Unsafe attachment language",
                detail="Email references a potentially unsafe attachment.",
                impact=20,
            )
        )

    if any(token in text for token in {"act now", "immediately", "within 24 hours", "final warning", "urgent action required"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Urgency language",
                detail="Email uses urgency to pressure the user.",
                impact=20,
            )
        )

    if any(token in text for token in {"gift card", "wire transfer", "payment overdue", "invoice attached", "bank transfer"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Financial fraud wording",
                detail="Email contains payment or financial fraud language.",
                impact=25,
            )
        )

    if any(token in text for token in {"verify your account", "confirm your identity", "reset your password", "login attempt"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Credential request",
                detail="Email requests account verification or credential-related action.",
                impact=25,
            )
        )

    if sender_lower and ("reply" in subject_lower or "re:" in subject_lower) and any(token in text for token in {"verify", "password", "bank", "payment"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Thread-style trust tactic",
                detail="Email may be using thread-style wording to appear trustworthy.",
                impact=10,
            )
        )

    return build_scan_response(
        channel="email",
        rule_indicators=rule_indicators,
        ml_signal=ml_signal,
    )
