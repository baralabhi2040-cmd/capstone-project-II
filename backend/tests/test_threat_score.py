from app.services.threat_score import build_rule_indicator, build_scan_response


def test_build_scan_response_exposes_ml_and_rule_scores():
    result = build_scan_response(
        channel="email",
        ml_signal={
            "score": 82,
            "confidence": 0.91,
            "predicted_label": "phishing",
            "title": "ML model found strong phishing patterns",
            "detail": "ML model estimated a phishing likelihood of 82/100 for this email.",
        },
        rule_indicators=[
            build_rule_indicator(
                title="Urgency language",
                detail="Email uses urgency to pressure the user.",
                impact=20,
            ),
            build_rule_indicator(
                title="Credential request",
                detail="Email requests account verification or credential-related action.",
                impact=25,
            ),
        ],
    )

    assert result["label"] == "phishing"
    assert result["ml_score"] == 82
    assert result["rule_score"] == 45
    assert result["threat_score"] >= 60
    assert result["summary"]
    assert result["recommendation"]
    assert result["indicators"][0]["source"] == "ml"


def test_build_scan_response_handles_rule_only_legitimate_case():
    result = build_scan_response(
        channel="url",
        rule_indicators=[],
        ml_signal=None,
    )

    assert result["label"] == "legitimate"
    assert result["ml_score"] is None
    assert result["rule_score"] == 0
    assert result["indicators"]


def test_channel_tuning_makes_sms_and_email_stricter_than_url():
    ml_signal = {
        "score": 55,
        "confidence": 0.8,
        "predicted_label": "phishing",
        "title": "ML model found mixed phishing signals",
        "detail": "ML model estimated a moderate phishing likelihood of 55/100.",
    }
    rule_indicators = [
        build_rule_indicator(
            title="Urgency language",
            detail="Message uses urgency language.",
            impact=20,
        )
    ]

    sms_result = build_scan_response(
        channel="sms",
        ml_signal=ml_signal,
        rule_indicators=rule_indicators,
    )
    email_result = build_scan_response(
        channel="email",
        ml_signal=ml_signal,
        rule_indicators=rule_indicators,
    )
    url_result = build_scan_response(
        channel="url",
        ml_signal=ml_signal,
        rule_indicators=rule_indicators,
    )

    assert sms_result["threat_score"] > url_result["threat_score"]
    assert email_result["threat_score"] > url_result["threat_score"]
    assert url_result["label"] == "legitimate"
    assert sms_result["label"] == "legitimate"
    assert email_result["label"] == "legitimate"


def test_channel_tuning_keeps_low_signal_sms_legitimate():
    result = build_scan_response(
        channel="sms",
        ml_signal={
            "score": 18,
            "confidence": 0.62,
            "predicted_label": "legitimate",
            "title": "ML model leaned legitimate",
            "detail": "ML model estimated a low phishing likelihood of 18/100 for this SMS.",
        },
        rule_indicators=[],
    )

    assert result["label"] == "legitimate"
    assert result["risk_level"] == "LOW"
    assert result["threat_score"] < 25
