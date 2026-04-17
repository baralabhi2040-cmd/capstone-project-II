from time import perf_counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_optional_user
from app.core.database import get_db
from app.core.security import sanitize_multiline_text, sanitize_text
from app.models.user import User
from app.schemas.response_schema import ScanResponse
from app.schemas.social_schema import SocialRequest
from app.services.detector_fallback import degraded_scan_response
from app.services.scan_log_service import persist_scan_result_safely
from app.services.social_detector import detect_social
from app.utils.logger import logger

router = APIRouter(tags=["Social"])


@router.post("/predict/social", response_model=ScanResponse)
def predict_social(
    payload: SocialRequest,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    platform = sanitize_text(payload.platform).lower()
    message = sanitize_multiline_text(payload.message)

    start = perf_counter()
    try:
        result = detect_social(platform, message)
    except Exception as exc:
        logger.exception("Social prediction failed; serving degraded fallback: %s", exc)
        result = degraded_scan_response(
            channel="social",
            platform=platform,
            reason="The social detector failed before a complete scan could be produced.",
        )

    combined_input = f"Platform: {platform}\nMessage: {message}"

    log = persist_scan_result_safely(
        db,
        scan_type="social",
        input_text=combined_input,
        result=result,
        platform=platform,
        user=user,
    )
    logger.info(
        "Social prediction completed label=%s score=%s saved=%s duration=%.3fs",
        result.get("label"),
        result.get("threat_score"),
        log is not None,
        perf_counter() - start,
    )
    return {
        **result,
        "scan_id": log.id if log else None,
        "saved_to_account": user is not None and log is not None,
    }
