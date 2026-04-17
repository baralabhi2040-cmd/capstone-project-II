import re
from urllib.parse import urlparse

SUSPICIOUS_TLDS = {".ru", ".tk", ".xyz", ".top", ".click", ".gq", ".ml", ".cf"}
SUSPICIOUS_KEYWORDS = {
    "login",
    "verify",
    "secure",
    "account",
    "update",
    "password",
    "bank",
    "payment",
    "invoice",
    "gift",
    "winner",
    "suspended",
    "urgent",
}

SHORTENER_DOMAINS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd"}

def extract_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower()
    except Exception:
        return ""

def has_ip_address(url: str) -> bool:
    return bool(re.search(r"(https?:\/\/)?(\d{1,3}\.){3}\d{1,3}", url))

def get_tld(domain: str) -> str:
    match = re.search(r"(\.[a-z]{2,10})$", domain)
    return match.group(1) if match else ""

def count_subdomains(domain: str) -> int:
    parts = [part for part in domain.split(".") if part]
    return max(0, len(parts) - 2)

def find_urls(text: str) -> list[str]:
    if not text:
        return []
    return re.findall(r"https?://[^\s]+", text)

def keyword_hits(text: str, keywords: set[str]) -> list[str]:
    lowered = text.lower()
    return [keyword for keyword in keywords if keyword in lowered]

def contains_shortened_url(text: str) -> bool:
    lowered = text.lower()
    return any(domain in lowered for domain in SHORTENER_DOMAINS)