from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_optional_user
from app.core.database import get_db
from app.models.scan_log import ScanLog
from app.models.user import User
from app.schemas.response_schema import ScanLogOut
from app.services.demo_data import demo_scan_logs
from app.services.scan_log_service import scan_log_to_dict
from app.utils.logger import logger

router = APIRouter(tags=["Logs"])

@router.get("/logs", response_model=list[ScanLogOut])
def get_scan_logs(
    limit: int = Query(default=100, ge=1, le=500),
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    try:
        query = db.query(ScanLog)
        if user is None:
            query = query.filter(ScanLog.user_id.is_(None))
        else:
            query = query.filter(ScanLog.user_id == user.id)

        rows = query.order_by(ScanLog.created_at.desc()).limit(limit).all()
        return [ScanLogOut(**scan_log_to_dict(row)) for row in rows]
    except Exception as exc:
        db.rollback()
        logger.warning("Log fallback served because live logs failed: %s", exc)
        return [ScanLogOut(**row) for row in demo_scan_logs(limit)]
