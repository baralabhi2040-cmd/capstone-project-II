from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.auth_token import AuthToken
from app.models.user import User
from app.models.verification_token import VerificationToken

PASSWORD_ITERATIONS = 390000
bearer_scheme = HTTPBearer(auto_error=False)


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    ).hex()
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt}${derived_key}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected_hash = stored_hash.split("$", 3)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        int(iterations),
    ).hex()
    return hmac.compare_digest(derived_key, expected_hash)


def create_plain_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_auth_token(db: Session, user_id: int) -> str:
    plain_token = create_plain_token()
    db.add(
        AuthToken(
            user_id=user_id,
            token_hash=hash_token(plain_token),
            expires_at=utcnow() + timedelta(hours=settings.auth_token_expiry_hours),
        )
    )
    db.commit()
    return plain_token


def revoke_auth_token(db: Session, plain_token: str) -> bool:
    token_hash = hash_token(plain_token)
    deleted = (
        db.query(AuthToken)
        .filter(AuthToken.token_hash == token_hash)
        .delete(synchronize_session=False)
    )
    db.commit()
    return deleted > 0


def create_verification_token(db: Session, user_id: int) -> str:
    (
        db.query(VerificationToken)
        .filter(VerificationToken.user_id == user_id)
        .filter(VerificationToken.consumed_at.is_(None))
        .delete(synchronize_session=False)
    )

    plain_token = create_plain_token()
    db.add(
        VerificationToken(
            user_id=user_id,
            token_hash=hash_token(plain_token),
            expires_at=utcnow()
            + timedelta(hours=settings.verification_token_expiry_hours),
        )
    )
    db.commit()
    return plain_token


def resolve_verification_token(
    db: Session,
    plain_token: str,
) -> VerificationToken | None:
    token_hash = hash_token(plain_token)
    return (
        db.query(VerificationToken)
        .filter(VerificationToken.token_hash == token_hash)
        .filter(VerificationToken.consumed_at.is_(None))
        .filter(VerificationToken.expires_at > utcnow())
        .first()
    )


def resolve_auth_token(db: Session, plain_token: str) -> AuthToken | None:
    token_hash = hash_token(plain_token)
    token_row = (
        db.query(AuthToken)
        .filter(AuthToken.token_hash == token_hash)
        .filter(AuthToken.expires_at > utcnow())
        .first()
    )

    if token_row is not None:
        token_row.last_used_at = utcnow()
        db.commit()

    return token_row


def _load_user_from_credentials(
    credentials: HTTPAuthorizationCredentials | None,
    db: Session,
) -> User | None:
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None

    token_row = resolve_auth_token(db, credentials.credentials)
    if token_row is None:
        return None

    return db.query(User).filter(User.id == token_row.user_id).first()


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    return _load_user_from_credentials(credentials, db)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    user = _load_user_from_credentials(credentials, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
    return user


def get_verified_user(user: User = Depends(get_current_user)) -> User:
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before using this feature.",
        )
    return user
