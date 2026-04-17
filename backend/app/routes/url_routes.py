from time import perf_counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_optional_user
from app.core.database import get_db
from app.core.security import sanitize_text
from app.models.user import User
from app.schemas.response_schema import ScanResponse
from app.schemas.url_schema import UrlRequest
from app.services.detector_fallback import degraded_scan_response
from app.services.scan_log_service import persist_scan_result_safely
from app.services.url_detector import detect_url, detect_url_rules_only
from app.utils.logger import logger

router = APIRouter(tags=["URL"])


@router.post("/predict/url", response_model=ScanResponse)
def predict_url(
    payload: UrlRequest,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    url = sanitize_text(payload.url)

    start = perf_counter()
    try:
        result = detect_url(url)
    except Exception as exc:
        logger.exception("URL prediction failed; trying rules-only fallback: %s", exc)
        try:
            result = detect_url_rules_only(url)
        except Exception as fallback_exc:
            logger.exception("URL rules-only fallback failed: %s", fallback_exc)
            result = degraded_scan_response(
                channel="url",
                reason="The URL detector failed before a complete scan could be produced.",
            )

    log = persist_scan_result_safely(
        db,
        scan_type="url",
        input_text=url,
        result=result,
        user=user,
    )
    logger.info(
        "URL prediction completed label=%s score=%s saved=%s duration=%.3fs",
        result.get("label"),
        result.get("threat_score"),
        log is not None,
        perf_counter() - start,
    )
    return {
        **result,
        "scan_id": log.id if log is not None else None,
        "saved_to_account": user is not None and log is not None,
    }
