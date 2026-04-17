from pydantic import BaseModel, Field, field_validator

class EmailRequest(BaseModel):
    sender: str = ""
    subject: str = ""
    body: str = Field(..., min_length=1)

    @field_validator("sender", "subject", "body")
    @classmethod
    def strip_values(cls, value: str) -> str:
        return value.strip()