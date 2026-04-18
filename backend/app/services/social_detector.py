from pathlib import Path

from app.services.model_guard import get_model_assets_nonblocking, warm_model_assets
from app.services.threat_score import (
    build_rule_indicator,
    build_scan_response,
    extract_ml_signal,
)
from app.utils.feature_extractor import contains_shortened_url, find_urls, keyword_hits

SOCIAL_KEYWORDS = {
    "verify your account",
    "winner",
    "prize",
    "investment",
    "crypto",
    "urgent",
    "click link",
    "giveaway",
    "login",
    "support team",
    "reset password",
    "free followers",
    "claim now",
    "limited offer",
    "exclusive reward",
    "money transfer",
    "official support",
    "verified account",
    "double your money",
}

ML_DIR = Path(__file__).resolve().parents[2] / "ml"
DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "processed" / "social_processed.csv"
MODEL_PATH = ML_DIR / "social_model.pkl"
VECTORIZER_PATH = ML_DIR / "social_vectorizer.pkl"


def warm_social_model_assets() -> None:
    warm_model_assets(
        str(DATA_PATH),
        str(MODEL_PATH),
        str(VECTORIZER_PATH),
    )


def detect_social(platform: str, message: str) -> dict:
    rule_indicators: list[dict] = []
    text = message.lower().strip()
    platform_name = platform.lower().strip()
    social_model, social_vectorizer = get_model_assets_nonblocking(
        str(DATA_PATH),
        str(MODEL_PATH),
        str(VECTORIZER_PATH),
    )
    ml_signal = None

    if social_model is not None and social_vectorizer is not None:
        vector = social_vectorizer.transform([message])
        ml_signal = extract_ml_signal(social_model, vector, channel_name="social message")

    hits = keyword_hits(text, SOCIAL_KEYWORDS)
    if hits:
        rule_indicators.append(
            build_rule_indicator(
                title="Suspicious social-engineering phrases",
                detail=f"Suspicious social-engineering phrases detected: {', '.join(hits[:8])}",
                impact=25,
            )
        )

    if find_urls(message):
        rule_indicators.append(
            build_rule_indicator(
                title="Contains link",
                detail="Message contains a link.",
                impact=20,
            )
        )

    if contains_shortened_url(message):
        rule_indicators.append(
            build_rule_indicator(
                title="Shortened URL detected",
                detail="Message uses a shortened URL.",
                impact=20,
            )
        )

    if any(token in text for token in {"official support", "verified account", "admin team"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Official-account impersonation",
                detail="Message may be impersonating an official support or admin account.",
                impact=25,
            )
        )

    if any(token in text for token in {"crypto", "investment", "double your money", "profit guaranteed"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Investment scam language",
                detail="Message includes investment or crypto scam language.",
                impact=25,
            )
        )

    if any(token in text for token in {"send money", "help me urgently", "emergency transfer", "pay now"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Urgent money request",
                detail="Message contains emotional manipulation or urgent money-request wording.",
                impact=20,
            )
        )

    if any(token in text for token in {"giveaway", "winner", "prize", "claim now", "exclusive reward"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Reward scam wording",
                detail="Message contains giveaway or reward scam wording.",
                impact=20,
            )
        )

    if platform_name in {"instagram", "telegram", "whatsapp"} and any(token in text for token in {"verify", "login", "account", "reset password"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Account-access targeting",
                detail=f"Message targets {platform_name} account access or identity confirmation.",
                impact=15,
            )
        )

    return build_scan_response(
        channel="social",
        rule_indicators=rule_indicators,
        ml_signal=ml_signal,
        platform=platform_name,
    )
