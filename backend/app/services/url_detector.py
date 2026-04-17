from pathlib import Path

from app.services.model_guard import load_model_assets
from app.services.threat_score import (
    build_rule_indicator,
    build_scan_response,
    extract_ml_signal,
)
from app.utils.feature_extractor import (
    SUSPICIOUS_KEYWORDS,
    SUSPICIOUS_TLDS,
    count_subdomains,
    extract_domain,
    get_tld,
    has_ip_address,
    keyword_hits,
)

ML_DIR = Path(__file__).resolve().parents[2] / "ml"
DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "processed" / "urls_processed.csv"
MODEL_PATH = ML_DIR / "url_model.pkl"
VECTORIZER_PATH = ML_DIR / "url_vectorizer.pkl"


def detect_url(url: str) -> dict:
    rule_indicators: list[dict] = []
    url_lower = url.lower().strip()
    url_model, url_vectorizer = load_model_assets(
        str(DATA_PATH),
        str(MODEL_PATH),
        str(VECTORIZER_PATH),
    )

    domain = extract_domain(url_lower)
    tld = get_tld(domain)
    ml_signal = None

    if url_model is not None and url_vectorizer is not None:
        vector = url_vectorizer.transform([url_lower])
        ml_signal = extract_ml_signal(url_model, vector, channel_name="URL")

    if not url_lower.startswith("https://"):
        rule_indicators.append(
            build_rule_indicator(
                title="No HTTPS",
                detail="URL does not use HTTPS.",
                impact=20,
            )
        )

    if has_ip_address(url_lower):
        rule_indicators.append(
            build_rule_indicator(
                title="IP address in URL",
                detail="URL contains an IP address instead of a standard domain.",
                impact=30,
            )
        )

    if tld in SUSPICIOUS_TLDS:
        rule_indicators.append(
            build_rule_indicator(
                title="Suspicious top-level domain",
                detail=f"Suspicious top-level domain detected: {tld}",
                impact=25,
            )
        )

    subdomain_count = count_subdomains(domain)
    if subdomain_count >= 2:
        rule_indicators.append(
            build_rule_indicator(
                title="Many subdomains",
                detail="URL contains many subdomains, which can be suspicious.",
                impact=20,
            )
        )

    if "@" in url_lower:
        rule_indicators.append(
            build_rule_indicator(
                title="Misleading '@' symbol",
                detail="URL contains '@', which may be used to mislead users.",
                impact=20,
            )
        )

    if len(url_lower) > 100:
        rule_indicators.append(
            build_rule_indicator(
                title="Unusually long URL",
                detail="URL is unusually long.",
                impact=15,
            )
        )

    hits = keyword_hits(url_lower, SUSPICIOUS_KEYWORDS)
    if hits:
        rule_indicators.append(
            build_rule_indicator(
                title="Suspicious URL keywords",
                detail=f"Suspicious keywords found in URL: {', '.join(hits[:6])}",
                impact=20,
            )
        )

    if any(token in url_lower for token in {"login", "verify", "secure", "account", "update", "password", "bank"}):
        rule_indicators.append(
            build_rule_indicator(
                title="Credential-related wording",
                detail="URL contains credential or account-related words often seen in phishing.",
                impact=20,
            )
        )

    return build_scan_response(
        channel="url",
        rule_indicators=rule_indicators,
        ml_signal=ml_signal,
    )
