from pydantic import BaseModel, Field, field_validator

ALLOWED_PLATFORMS = {
    "instagram",
    "facebook",
    "whatsapp",
    "telegram",
    "linkedin",
    "x",
    "snapchat",
}

class SocialRequest(BaseModel):
    platform: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, value: str) -> str:
        value = value.strip().lower()
        if value not in ALLOWED_PLATFORMS:
            raise ValueError(f"Platform must be one of: {', '.join(sorted(ALLOWED_PLATFORMS))}")
        return value

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        return value.strip()