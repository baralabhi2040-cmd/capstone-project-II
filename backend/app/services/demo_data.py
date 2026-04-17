from __future__ import annotations

from collections import Counter, defaultdict
from datetime import UTC, datetime, timedelta


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def demo_scan_logs(limit: int = 100) -> list[dict]:
    now = _utcnow()
    rows = [
        {
            "id": 9001,
            "scan_type": "url",
            "platform": None,
            "input_text": "https://secure-bank-login.example/verify",
            "label": "phishing",
            "confidence": 0.91,
            "threat_score": 92,
            "ml_score": 86,
            "rule_score": 94,
            "risk_level": "CRITICAL",
            "reasons": ["Suspicious login URL", "Credential collection pattern"],
            "summary": "Demo fallback marked this URL as critical risk based on phishing-style login language.",
            "recommendation": "Do not enter credentials or continue to the destination.",
            "indicators": [
                {
                    "source": "rule",
                    "title": "Credential prompt",
                    "detail": "The URL resembles a login or verification lure.",
                    "impact": 30,
                    "severity": "high",
                }
            ],
            "snapshot_sent_at": None,
            "created_at": now - timedelta(days=1),
        },
        {
            "id": 9002,
            "scan_type": "email",
            "platform": None,
            "input_text": "Sender: security@example.com\nSubject: Urgent account verification",
            "label": "phishing",
            "confidence": 0.88,
            "threat_score": 87,
            "ml_score": 78,
            "rule_score": 91,
            "risk_level": "HIGH",
            "reasons": ["Urgency language", "Account verification lure"],
            "summary": "Demo fallback identified urgent account-verification pressure in this email.",
            "recommendation": "Verify through the official website instead of clicking message links.",
            "indicators": [
                {
                    "source": "rule",
                    "title": "Urgency pressure",
                    "detail": "The message pushes immediate account action.",
                    "impact": 24,
                    "severity": "high",
                }
            ],
            "snapshot_sent_at": None,
            "created_at": now - timedelta(days=2),
        },
        {
            "id": 9003,
            "scan_type": "sms",
            "platform": None,
            "input_text": "Sender: 212\nMessage: Congratulations, you won a prize.",
            "label": "phishing",
            "confidence": 0.84,
            "threat_score": 82,
            "ml_score": 64,
            "rule_score": 90,
            "risk_level": "HIGH",
            "reasons": ["Prize-scam language", "Short sender pattern"],
            "summary": "Demo fallback detected reward-bait language commonly seen in SMS scams.",
            "recommendation": "Do not reply, tap links, or share personal details.",
            "indicators": [
                {
                    "source": "rule",
                    "title": "Prize lure",
                    "detail": "The message promises a reward to trigger engagement.",
                    "impact": 26,
                    "severity": "high",
                }
            ],
            "snapshot_sent_at": None,
            "created_at": now - timedelta(days=3),
        },
        {
            "id": 9004,
            "scan_type": "social",
            "platform": "instagram",
            "input_text": "Platform: instagram\nMessage: Verify your account to claim giveaway.",
            "label": "phishing",
            "confidence": 0.81,
            "threat_score": 78,
            "ml_score": 66,
            "rule_score": 83,
            "risk_level": "HIGH",
            "reasons": ["Giveaway lure", "Account verification prompt"],
            "summary": "Demo fallback flagged a social-media account verification and giveaway lure.",
            "recommendation": "Report the message and verify account status only through the official app.",
            "indicators": [
                {
                    "source": "rule",
                    "title": "Giveaway lure",
                    "detail": "The message uses a fake reward to request account action.",
                    "impact": 22,
                    "severity": "medium",
                }
            ],
            "snapshot_sent_at": None,
            "created_at": now - timedelta(days=4),
        },
        {
            "id": 9005,
            "scan_type": "url",
            "platform": None,
            "input_text": "https://www.example.edu/security-awareness",
            "label": "legitimate",
            "confidence": 0.76,
            "threat_score": 12,
            "ml_score": 10,
            "rule_score": 8,
            "risk_level": "LOW",
            "reasons": ["No strong phishing indicators"],
            "summary": "Demo fallback treated this as low risk because no strong phishing indicators were present.",
            "recommendation": "Continue normal caution and verify the domain before entering sensitive data.",
            "indicators": [],
            "snapshot_sent_at": None,
            "created_at": now - timedelta(days=5),
        },
    ]
    return rows[:limit]


def demo_stats(scope: str = "demo") -> dict:
    rows = demo_scan_logs()
    total_scans = len(rows)
    phishing_count = sum(1 for row in rows if row["label"] == "phishing")
    legitimate_count = total_scans - phishing_count
    channel_counts = Counter(row["scan_type"] for row in rows)
    risk_distribution = Counter(row["risk_level"] for row in rows)
    most_targeted_channel = (
        channel_counts.most_common(1)[0][0] if channel_counts else "-"
    )

    start_date = datetime.now(UTC).date() - timedelta(days=6)
    daily_map = defaultdict(lambda: {"phishing": 0, "legitimate": 0})
    for index in range(7):
        daily_map[(start_date + timedelta(days=index)).isoformat()]

    for row in rows:
        day_key = row["created_at"].date().isoformat()
        if day_key in daily_map:
            daily_map[day_key][row["label"]] += 1

    return {
        "total_scans": total_scans,
        "phishing_count": phishing_count,
        "legitimate_count": legitimate_count,
        "most_targeted_channel": most_targeted_channel,
        "scope": scope,
        "channel_counts": dict(channel_counts),
        "risk_distribution": dict(risk_distribution),
        "daily_activity": [
            {"day": day, **counts}
            for day, counts in sorted(daily_map.items())
        ],
    }
