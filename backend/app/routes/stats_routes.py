from collections import Counter, defaultdict
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_optional_user
from app.core.database import get_db
from app.models.scan_log import ScanLog
from app.models.user import User

router = APIRouter(tags=["Stats"])

@router.get("/stats")
def get_stats(
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    query = db.query(ScanLog)
    if user is None:
        query = query.filter(ScanLog.user_id.is_(None))
    else:
        query = query.filter(ScanLog.user_id == user.id)

    rows = query.all()

    total_scans = len(rows)
    phishing_count = sum(1 for row in rows if row.label == "phishing")
    legitimate_count = sum(1 for row in rows if row.label == "legitimate")

    channel_counts = Counter(row.scan_type for row in rows)
    risk_distribution = Counter(row.risk_level for row in rows)

    most_targeted_channel = "-"
    if channel_counts:
        most_targeted_channel = channel_counts.most_common(1)[0][0]

    average_threat_score = 0
    if rows:
        average_threat_score = round(
            sum(row.threat_score for row in rows) / len(rows),
            2,
        )

    start_date = datetime.now(UTC).date() - timedelta(days=6)
    daily_map = defaultdict(lambda: {"phishing": 0, "legitimate": 0})

    for index in range(7):
        day = start_date + timedelta(days=index)
        daily_map[day.isoformat()]

    for row in rows:
        day_key = row.created_at.date().isoformat()
        if day_key in daily_map:
            if row.label == "phishing":
                daily_map[day_key]["phishing"] += 1
            else:
                daily_map[day_key]["legitimate"] += 1

    daily_activity = [
        {"day": day, **counts}
        for day, counts in sorted(daily_map.items())
    ]

    return {
        "total_scans": total_scans,
        "phishing_count": phishing_count,
        "legitimate_count": legitimate_count,
        "channel_counts": dict(channel_counts),
        "risk_distribution": dict(risk_distribution),
        "most_targeted_channel": most_targeted_channel,
        "average_threat_score": average_threat_score,
        "daily_activity": daily_activity,
        "scope": "personal" if user is not None else "guest",
        "verification_required_for_snapshots": True,
    }
