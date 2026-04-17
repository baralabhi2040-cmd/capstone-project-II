from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    scan_type = Column(String(30), nullable=False, index=True)
    platform = Column(String(50), nullable=True)
    input_text = Column(Text, nullable=False)
    label = Column(String(20), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    threat_score = Column(Integer, nullable=False)
    ml_score = Column(Integer, nullable=True)
    rule_score = Column(Integer, nullable=False, default=0)
    risk_level = Column(String(20), nullable=False)
    reasons = Column(Text, nullable=False)
    summary = Column(Text, nullable=False, default="")
    recommendation = Column(Text, nullable=False, default="")
    indicators = Column(Text, nullable=False, default="[]")
    snapshot_sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False, index=True)
