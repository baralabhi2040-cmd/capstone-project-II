from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_optional_user
from app.core.database import get_db
from app.core.security import sanitize_multiline_text, sanitize_text
from app.models.user import User
from app.schemas.response_schema import ScanResponse
from app.schemas.sms_schema import SmsRequest
from app.services.scan_log_service import persist_scan_result
from app.services.sms_detector import detect_sms

router = APIRouter(tags=["SMS"])


@router.post("/predict/sms", response_model=ScanResponse)
def predict_sms(
    payload: SmsRequest,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    sender = sanitize_text(payload.sender)
    message = sanitize_multiline_text(payload.message)

    result = detect_sms(sender, message)

    combined_input = f"Sender: {sender}\nMessage: {message}"

    log = persist_scan_result(
        db,
        scan_type="sms",
        input_text=combined_input,
        result=result,
        user=user,
    )
    return {**result, "scan_id": log.id, "saved_to_account": user is not None}
