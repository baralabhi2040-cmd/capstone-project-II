from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_optional_user
from app.core.database import get_db
from app.core.security import sanitize_text
from app.models.user import User
from app.schemas.response_schema import ScanResponse
from app.schemas.url_schema import UrlRequest
from app.services.scan_log_service import persist_scan_result_safely
from app.services.url_detector import detect_url

router = APIRouter(tags=["URL"])


@router.post("/predict/url", response_model=ScanResponse)
def predict_url(
    payload: UrlRequest,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    url = sanitize_text(payload.url)

    result = detect_url(url)
    log = persist_scan_result_safely(
        db,
        scan_type="url",
        input_text=url,
        result=result,
        user=user,
    )
    return {
        **result,
        "scan_id": log.id if log is not None else None,
        "saved_to_account": user is not None and log is not None,
    }
