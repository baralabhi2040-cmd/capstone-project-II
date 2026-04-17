import re

def normalize_text(text: str | None) -> str:
    if not text:
        return ""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    return text

def to_lower(text: str | None) -> str:
    return normalize_text(text).lower()