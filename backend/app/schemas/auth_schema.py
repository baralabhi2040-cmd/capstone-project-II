from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    is_verified: bool
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserOut
    message: str
    delivery_mode: str | None = None
    verification_preview_url: str | None = None
    preview_path: str | None = None


class MessageResponse(BaseModel):
    message: str
    delivery_mode: str | None = None
    verification_preview_url: str | None = None
    preview_path: str | None = None
