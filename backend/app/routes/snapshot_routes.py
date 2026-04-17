from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_verified_user, utcnow
from app.core.database import get_db
from app.models.scan_log import ScanLog
from app.models.user import User
from app.schemas.auth_schema import MessageResponse
from app.services.mail_service import send_scan_snapshot_email

router = APIRouter(prefix="/snapshots", tags=["Snapshots"])


@router.post("/{scan_id}/email", response_model=MessageResponse)
def email_snapshot(
    scan_id: int,
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    scan_log = (
        db.query(ScanLog)
        .filter(ScanLog.id == scan_id)
        .filter(ScanLog.user_id == user.id)
        .first()
    )
    if scan_log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="We could not find that scan in your personal history.",
        )

    delivery = send_scan_snapshot_email(user, scan_log)
    scan_log.snapshot_sent_at = utcnow()
    db.commit()

    return MessageResponse(
        message="Your scan snapshot has been sent.",
        delivery_mode=delivery.get("mode"),
        preview_path=delivery.get("preview_path"),
    )
