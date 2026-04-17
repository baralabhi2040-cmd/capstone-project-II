from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import ensure_database_schema
from app.core.database import get_db
from app.services.mail_service import email_delivery_mode

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    database_status = "connected"
    try:
        ensure_database_schema()
        db.execute(text("SELECT 1"))
    except Exception:
        database_status = "disconnected"

    return {
        "status": "ok",
        "database": database_status,
        "version": settings.app_version,
        "rules_engine": "enabled",
        "auth": "enabled",
        "email_delivery": email_delivery_mode(),
    }
