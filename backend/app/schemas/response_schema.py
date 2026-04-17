from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ScanIndicator(BaseModel):
    source: str
    title: str
    detail: str
    impact: int
    severity: str


class ScanResponse(BaseModel):
    scan_id: Optional[int] = None
    saved_to_account: bool = False
    label: str
    confidence: float
    threat_score: int
    ml_score: Optional[int] = None
    rule_score: int
    risk_level: str
    channel: str
    platform: Optional[str] = None
    reasons: list[str]
    summary: str
    recommendation: str
    indicators: list[ScanIndicator]

class ScanLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scan_type: str
    platform: Optional[str] = None
    input_text: str
    label: str
    confidence: float
    threat_score: int
    ml_score: Optional[int] = None
    rule_score: int
    risk_level: str
    reasons: list[str]
    summary: str
    recommendation: str
    indicators: list[ScanIndicator]
    snapshot_sent_at: Optional[datetime] = None
    created_at: datetime
