from pydantic import BaseModel, Field, field_validator

class UrlRequest(BaseModel):
    url: str = Field(..., min_length=4)

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        value = value.strip()
        if not (value.startswith("http://") or value.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        return value