from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_optional_user
from app.core.database import get_db
from app.core.security import sanitize_multiline_text, sanitize_text
from app.models.user import User
from app.schemas.response_schema import ScanResponse
from app.schemas.social_schema import SocialRequest
from app.services.scan_log_service import persist_scan_result
from app.services.social_detector import detect_social

router = APIRouter(tags=["Social"])


@router.post("/predict/social", response_model=ScanResponse)
def predict_social(
    payload: SocialRequest,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    platform = sanitize_text(payload.platform).lower()
    message = sanitize_multiline_text(payload.message)

    result = detect_social(platform, message)

    combined_input = f"Platform: {platform}\nMessage: {message}"

    log = persist_scan_result(
        db,
        scan_type="social",
        input_text=combined_input,
        result=result,
        platform=platform,
        user=user,
    )
    return {**result, "scan_id": log.id, "saved_to_account": user is not None}
