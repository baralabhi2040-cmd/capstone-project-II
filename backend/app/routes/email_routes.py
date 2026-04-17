from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_optional_user
from app.core.database import get_db
from app.core.security import sanitize_multiline_text, sanitize_text
from app.models.user import User
from app.schemas.email_schema import EmailRequest
from app.schemas.response_schema import ScanResponse
from app.services.email_detector import detect_email
from app.services.scan_log_service import persist_scan_result_safely

router = APIRouter(tags=["Email"])


@router.post("/predict/email", response_model=ScanResponse)
def predict_email(
    payload: EmailRequest,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    sender = sanitize_text(payload.sender)
    subject = sanitize_text(payload.subject)
    body = sanitize_multiline_text(payload.body)

    result = detect_email(sender, subject, body)

    combined_input = f"Sender: {sender}\nSubject: {subject}\nBody: {body}"

    log = persist_scan_result_safely(
        db,
        scan_type="email",
        input_text=combined_input,
        result=result,
        user=user,
    )
    return {
        **result,
        "scan_id": log.id if log is not None else None,
        "saved_to_account": user is not None and log is not None,
    }
