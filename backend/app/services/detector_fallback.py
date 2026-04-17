from app.services.threat_score import build_rule_indicator, build_scan_response


def degraded_scan_response(
    *,
    channel: str,
    reason: str,
    platform: str | None = None,
) -> dict:
    result = build_scan_response(
        channel=channel,
        platform=platform,
        ml_signal=None,
        rule_indicators=[
            build_rule_indicator(
                title="Detector fallback",
                detail=reason,
                impact=40,
            )
        ],
    )
    result["summary"] = (
        "PhishGuard returned a degraded fallback result because the full detector "
        "could not complete safely."
    )
    result["recommendation"] = (
        "Treat this item cautiously and retry the scan shortly. If it is urgent, "
        "verify through an official channel before acting."
    )
    return result
