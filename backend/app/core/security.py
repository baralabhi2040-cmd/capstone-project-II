import re

def sanitize_text(value: str | None) -> str:
    if not value:
        return ""
    value = value.replace("\x00", " ")
    value = re.sub(r"\s+", " ", value).strip()
    return value

def sanitize_multiline_text(value: str | None) -> str:
    if not value:
        return ""
    value = value.replace("\x00", " ")
    value = re.sub(r"\r\n?", "\n", value)
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()