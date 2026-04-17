from __future__ import annotations

from html import escape

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.auth import (
    bearer_scheme,
    create_auth_token,
    create_verification_token,
    get_current_user,
    hash_password,
    normalize_email,
    resolve_verification_token,
    revoke_auth_token,
    utcnow,
    verify_password,
)
from app.core.database import get_db
from app.core.config import settings
from app.core.security import sanitize_text
from app.models.user import User
from app.schemas.auth_schema import (
    AuthResponse,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    UserOut,
)
from app.services.mail_service import send_verification_email

router = APIRouter(prefix="/auth", tags=["Auth"])


def _serialize_user(user: User) -> UserOut:
    return UserOut.model_validate(user)


def _validate_email(value: str) -> str:
    email = normalize_email(sanitize_text(value))
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid email address.",
        )
    return email


def _complete_verification(token: str, db: Session) -> str:
    token_row = resolve_verification_token(db, token.strip())
    if token_row is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification link is invalid or has expired.",
        )

    user = db.query(User).filter(User.id == token_row.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The account linked to this verification token no longer exists.",
        )

    user.is_verified = True
    token_row.consumed_at = utcnow()
    db.commit()
    return "Your email has been verified. You can now receive scan snapshots."


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    full_name = sanitize_text(payload.full_name)
    email = _validate_email(payload.email)
    password = payload.password.strip()

    if len(full_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name must be at least 2 characters long.",
        )

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists.",
        )

    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    verification_token = create_verification_token(db, user.id)
    delivery = send_verification_email(user, verification_token)
    auth_token = create_auth_token(db, user.id)
    verification_preview_url = (
        delivery.get("verification_link")
        if delivery.get("mode") == "preview"
        else None
    )

    return AuthResponse(
        token=auth_token,
        user=_serialize_user(user),
        message="Account created. Check your email to verify your PhishGuard profile.",
        delivery_mode=delivery.get("mode"),
        verification_preview_url=verification_preview_url,
        preview_path=delivery.get("preview_path"),
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = _validate_email(payload.email)
    password = payload.password.strip()
    user = db.query(User).filter(User.email == email).first()

    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    auth_token = create_auth_token(db, user.id)
    message = "Signed in successfully."
    if not user.is_verified:
        message += " Verify your email to unlock snapshot delivery."

    return AuthResponse(
        token=auth_token,
        user=_serialize_user(user),
        message=message,
    )


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return _serialize_user(user)


@router.post("/logout", response_model=MessageResponse)
def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if credentials is not None:
        revoke_auth_token(db, credentials.credentials)

    return MessageResponse(message=f"Signed out {user.full_name}.")


@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.is_verified:
        return MessageResponse(message="Your email is already verified.")

    verification_token = create_verification_token(db, user.id)
    delivery = send_verification_email(user, verification_token)
    verification_preview_url = (
        delivery.get("verification_link")
        if delivery.get("mode") == "preview"
        else None
    )

    return MessageResponse(
        message="A fresh verification email has been sent.",
        delivery_mode=delivery.get("mode"),
        verification_preview_url=verification_preview_url,
        preview_path=delivery.get("preview_path"),
    )


@router.get("/verify", response_model=MessageResponse)
def verify_email(
    token: str = Query(..., min_length=20),
    db: Session = Depends(get_db),
):
    return MessageResponse(message=_complete_verification(token, db))


@router.get("/verify-page", include_in_schema=False, response_class=HTMLResponse)
def verify_email_page(
    token: str = Query(..., min_length=20),
    db: Session = Depends(get_db),
):
    redirect_url = f"{settings.frontend_base_url}/auth?verified=1"
    frontend_settings_url = f"{settings.frontend_base_url}/settings"
    frontend_scan_url = f"{settings.frontend_base_url}/scan/email"

    try:
        message = _complete_verification(token, db)
        title = "Email verified"
        accent = "#31d08b"
        detail = "Your PhishGuard account is now verified, so snapshot delivery has been unlocked."
        status_code = status.HTTP_200_OK
        redirect_notice = "You will be redirected back into the PhishGuard account workspace in a few seconds."
        refresh_meta = f'<meta http-equiv="refresh" content="3;url={escape(redirect_url)}" />'
        redirect_script = f"""
        <script>
          window.setTimeout(function () {{
            window.location.replace({redirect_url!r});
          }}, 2600);
        </script>
        """.strip()
    except HTTPException as exc:
        title = "Verification failed"
        accent = "#ff7a8c"
        message = exc.detail
        detail = "This preview verification link could not be completed. You can request a fresh email from your account settings."
        status_code = exc.status_code
        redirect_notice = "Automatic return is disabled because the verification did not complete."
        refresh_meta = ""
        redirect_script = ""

    html = f"""
    <html>
      <head>
        <title>{escape(title)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {refresh_meta}
      </head>
      <body style="margin:0; font-family:Segoe UI, Arial, sans-serif; background:#07111d; color:#eef6ff; padding:32px;">
        <div style="max-width:760px; margin:0 auto; border-radius:24px; border:1px solid rgba(90,138,184,0.24); background:linear-gradient(180deg, rgba(255,255,255,0.04), transparent), #0b1727; padding:32px;">
          <p style="margin:0 0 12px; color:#7fa7d8; letter-spacing:0.16em; font-size:12px; text-transform:uppercase;">PhishGuard local preview</p>
          <h1 style="margin:0; font-size:38px; line-height:1.05;">{escape(title)}</h1>
          <p style="margin:16px 0 0; font-size:18px; color:{accent}; font-weight:700;">{escape(message)}</p>
          <p style="margin:14px 0 0; line-height:1.7; color:#c4d7f2;">{escape(detail)}</p>
          <p style="margin:14px 0 0; line-height:1.7; color:#8fb7dd;">{escape(redirect_notice)}</p>
          <div style="margin-top:24px; display:flex; flex-wrap:wrap; gap:12px;">
            <a href="{escape(redirect_url)}" style="display:inline-block; padding:14px 18px; border-radius:14px; text-decoration:none; font-weight:700; color:#06111a; background:linear-gradient(90deg, #44d9ff, #79f0d0);">Continue to account workspace</a>
            <a href="{escape(frontend_settings_url)}" style="display:inline-block; padding:14px 18px; border-radius:14px; text-decoration:none; font-weight:700; color:#06111a; background:linear-gradient(90deg, #44d9ff, #79f0d0);">Open account settings</a>
            <a href="{escape(frontend_scan_url)}" style="display:inline-block; padding:14px 18px; border-radius:14px; text-decoration:none; font-weight:700; color:#e9f3ff; border:1px solid rgba(90,138,184,0.26); background:rgba(10,20,34,0.75);">Go to scanners</a>
          </div>
        </div>
        {redirect_script}
      </body>
    </html>
    """.strip()

    return HTMLResponse(content=html, status_code=status_code)
