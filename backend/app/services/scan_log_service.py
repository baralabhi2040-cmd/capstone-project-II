from __future__ import annotations

import json

from sqlalchemy.orm import Session

from app.models.scan_log import ScanLog
from app.models.user import User


def persist_scan_result(
    db: Session,
    *,
    scan_type: str,
    input_text: str,
    result: dict,
    platform: str | None = None,
    user: User | None = None,
) -> ScanLog:
    log = ScanLog(
        user_id=user.id if user is not None else None,
        scan_type=scan_type,
        platform=platform,
        input_text=input_text,
        label=result["label"],
        confidence=result["confidence"],
        threat_score=result["threat_score"],
        ml_score=result.get("ml_score"),
        rule_score=result.get("rule_score", 0),
        risk_level=result["risk_level"],
        reasons=json.dumps(result.get("reasons", [])),
        summary=result.get("summary", ""),
        recommendation=result.get("recommendation", ""),
        indicators=json.dumps(result.get("indicators", [])),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def scan_log_to_dict(row: ScanLog) -> dict:
    def _loads(payload: str | None, fallback):
        if not payload:
            return fallback
        try:
            return json.loads(payload)
        except json.JSONDecodeError:
            return fallback

    return {
        "id": row.id,
        "scan_type": row.scan_type,
        "platform": row.platform,
        "input_text": row.input_text,
        "label": row.label,
        "confidence": row.confidence,
        "threat_score": row.threat_score,
        "ml_score": row.ml_score,
        "rule_score": row.rule_score,
        "risk_level": row.risk_level,
        "reasons": _loads(row.reasons, []),
        "summary": row.summary,
        "recommendation": row.recommendation,
        "indicators": _loads(row.indicators, []),
        "snapshot_sent_at": row.snapshot_sent_at,
        "created_at": row.created_at,
    }
