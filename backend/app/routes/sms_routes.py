from time import perf_counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_optional_user
from app.core.database import get_db
from app.core.security import sanitize_multiline_text, sanitize_text
from app.models.user import User
from app.schemas.response_schema import ScanResponse
from app.schemas.sms_schema import SmsRequest
from app.services.detector_fallback import degraded_scan_response
from app.services.scan_log_service import persist_scan_result_safely
from app.services.sms_detector import detect_sms
from app.utils.logger import logger

router = APIRouter(tags=["SMS"])


@router.post("/predict/sms", response_model=ScanResponse)
def predict_sms(
    payload: SmsRequest,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    sender = sanitize_text(payload.sender)
    message = sanitize_multiline_text(payload.message)

    start = perf_counter()
    try:
        result = detect_sms(sender, message)
    except Exception as exc:
        logger.exception("SMS prediction failed; serving degraded fallback: %s", exc)
        result = degraded_scan_response(
            channel="sms",
            reason="The SMS detector failed before a complete scan could be produced.",
        )

    combined_input = f"Sender: {sender}\nMessage: {message}"

    log = persist_scan_result_safely(
        db,
        scan_type="sms",
        input_text=combined_input,
        result=result,
        user=user,
    )
    logger.info(
        "SMS prediction completed label=%s score=%s saved=%s duration=%.3fs",
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
