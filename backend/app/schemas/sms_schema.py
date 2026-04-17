from pydantic import BaseModel, Field, field_validator

class SmsRequest(BaseModel):
    sender: str = ""
    message: str = Field(..., min_length=1)

    @field_validator("sender", "message")
    @classmethod
    def strip_values(cls, value: str) -> str:
        return value.strip()