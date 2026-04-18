from __future__ import annotations


def clamp_score(score: int | float) -> int:
    return max(0, min(100, int(round(score))))


def severity_from_impact(impact: int | float) -> str:
    safe_impact = clamp_score(impact)
    if safe_impact >= 30:
        return "high"
    if safe_impact >= 18:
        return "medium"
    return "low"


def risk_level_from_score(score: int | float) -> str:
    score = clamp_score(score)
    if score >= 85:
        return "CRITICAL"
    if score >= 70:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    return "LOW"


def build_rule_indicator(
    *,
    title: str,
    detail: str,
    impact: int | float,
) -> dict:
    safe_impact = clamp_score(impact)
    return {
        "source": "rule",
        "title": title,
        "detail": detail,
        "impact": safe_impact,
        "severity": severity_from_impact(safe_impact),
    }


def extract_ml_signal(model, vector, *, channel_name: str) -> dict | None:
    if model is None:
        return None

    predicted_label = model.predict(vector)[0]
    confidence = None
    phishing_probability = None

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(vector)[0]
        classes = list(model.classes_)
        confidence = float(max(probabilities))
        if "phishing" in classes:
            phishing_probability = float(probabilities[classes.index("phishing")])

    if phishing_probability is None:
        phishing_probability = 0.75 if predicted_label == "phishing" else 0.25

    score = clamp_score(phishing_probability * 100)
    confidence = round(float(confidence if confidence is not None else max(phishing_probability, 1 - phishing_probability)), 2)

    if score >= 70:
        title = "ML model found strong phishing patterns"
        detail = f"ML model estimated a phishing likelihood of {score}/100 for this {channel_name}."
    elif score >= 40:
        title = "ML model found mixed phishing signals"
        detail = f"ML model estimated a moderate phishing likelihood of {score}/100 for this {channel_name}."
    else:
        title = "ML model leaned legitimate"
        detail = f"ML model estimated a low phishing likelihood of {score}/100 for this {channel_name}."

    return {
        "predicted_label": predicted_label,
        "confidence": confidence,
        "score": score,
        "title": title,
        "detail": detail,
    }


def channel_policy(channel: str) -> dict:
    normalized_channel = channel.lower().strip()

    if normalized_channel == "sms":
        return {
            "phishing_threshold": 58,
            "base_bonus": 2,
            "rule_bonus_threshold": 55,
            "rule_bonus": 1,
            "ml_bonus_threshold": 45,
            "ml_bonus": 1,
            "max_bonus": 4,
        }
    if normalized_channel == "email":
        return {
            "phishing_threshold": 59,
            "base_bonus": 2,
            "rule_bonus_threshold": 50,
            "rule_bonus": 1,
            "ml_bonus_threshold": 45,
            "ml_bonus": 1,
            "max_bonus": 3,
        }
    if normalized_channel == "social":
        return {
            "phishing_threshold": 60,
            "base_bonus": 1,
            "rule_bonus_threshold": 50,
            "rule_bonus": 1,
            "ml_bonus_threshold": 45,
            "ml_bonus": 1,
            "max_bonus": 2,
        }
    return {
        "phishing_threshold": 62 if normalized_channel == "url" else 60,
        "base_bonus": 0,
        "rule_bonus_threshold": 999,
        "rule_bonus": 0,
        "ml_bonus_threshold": 999,
        "ml_bonus": 0,
        "max_bonus": 0,
    }


def blend_scores(ml_score: int | None, rule_score: int) -> tuple[int, int]:
    safe_rule_score = clamp_score(rule_score)
    if ml_score is None:
        final_score = safe_rule_score
        if safe_rule_score >= 80:
            final_score += 8
        elif safe_rule_score >= 60:
            final_score += 5
        elif safe_rule_score >= 35:
            final_score += 3
        elif safe_rule_score > 0:
            final_score += 1
        return clamp_score(final_score), 0

    safe_ml_score = clamp_score(ml_score)
    ml_impact = round(safe_ml_score * 0.68)
    rule_impact = round(safe_rule_score * 0.42)
    final_score = ml_impact + rule_impact

    if safe_ml_score >= 80 and safe_rule_score >= 45:
        final_score += 10
    elif safe_ml_score >= 65 and safe_rule_score >= 35:
        final_score += 7
    elif safe_ml_score >= 50 and safe_rule_score >= 20:
        final_score += 4
    elif safe_rule_score >= 70 and safe_ml_score >= 30:
        final_score += 7
    elif safe_rule_score >= 45 and safe_ml_score >= 20:
        final_score += 4
    elif safe_ml_score <= 25 and safe_rule_score <= 15:
        final_score -= 5

    if safe_rule_score >= 90:
        final_score = max(final_score, 84)
    elif safe_rule_score >= 75:
        final_score = max(final_score, 76)

    if safe_ml_score >= 90:
        final_score = max(final_score, 86)
    elif safe_ml_score >= 75:
        final_score = max(final_score, 72)

    strongest_signal = max(safe_ml_score, safe_rule_score)
    if strongest_signal >= 85:
        final_score += 6
    elif strongest_signal >= 70:
        final_score += 4
    elif strongest_signal >= 55:
        final_score += 3
    elif strongest_signal >= 35:
        final_score += 2
    elif strongest_signal > 0:
        final_score += 1

    return clamp_score(final_score), clamp_score(ml_impact)


def apply_channel_tuning(
    *,
    channel: str,
    final_score: int,
    ml_score: int | None,
    rule_score: int,
) -> tuple[int, int]:
    policy = channel_policy(channel)
    strongest_signal = max(final_score, rule_score, ml_score or 0)
    tuned_score = final_score
    bonus = 0

    if strongest_signal >= 30:
        bonus += policy["base_bonus"]
    if rule_score >= policy["rule_bonus_threshold"]:
        bonus += policy["rule_bonus"]
    if ml_score is not None and ml_score >= policy["ml_bonus_threshold"]:
        bonus += policy["ml_bonus"]

    tuned_score += min(bonus, policy["max_bonus"])

    if strongest_signal < 20:
        tuned_score = min(
            tuned_score,
            final_score + (1 if channel in {"sms", "email", "social"} and strongest_signal > 0 else 0),
        )

    if final_score < 25:
        tuned_score = min(tuned_score, 28)

    return clamp_score(tuned_score), policy["phishing_threshold"]


def determine_label(
    final_score: int,
    ml_score: int | None,
    rule_score: int,
    *,
    phishing_threshold: int = 60,
) -> str:
    if final_score >= phishing_threshold:
        return "phishing"
    high_ml_threshold = min(80, phishing_threshold + 18)
    high_rule_threshold = min(75, phishing_threshold + 15)
    combo_ml_threshold = max(45, phishing_threshold - 7)
    combo_rule_threshold = max(35, phishing_threshold - 18)

    if ml_score is not None and ml_score >= high_ml_threshold:
        return "phishing"
    if rule_score >= high_rule_threshold:
        return "phishing"
    if ml_score is not None and ml_score >= combo_ml_threshold and rule_score >= combo_rule_threshold:
        return "phishing"
    return "legitimate"


def confidence_from_components(
    *,
    final_score: int,
    label: str,
    ml_score: int | None,
    rule_score: int,
    decision_boundary: int,
) -> float:
    distance_from_boundary = abs(final_score - decision_boundary)
    confidence = 0.58 + min(distance_from_boundary / 100, 0.25)

    if ml_score is not None:
        ml_label = "phishing" if ml_score >= 50 else "legitimate"
        rule_label = "phishing" if rule_score >= 50 else "legitimate"

        if ml_label == rule_label == label:
            confidence += 0.10
        elif ml_label != rule_label:
            confidence -= 0.05
        else:
            confidence += 0.03
    elif label == "phishing" and rule_score >= 70:
        confidence += 0.05

    return round(max(0.55, min(0.99, confidence)), 2)


def summarize_assessment(
    *,
    channel: str,
    label: str,
    risk_level: str,
    ml_score: int | None,
    rule_score: int,
) -> str:
    subject = "social message" if channel == "social" else channel

    if label == "phishing":
        if ml_score is not None and rule_score >= 30:
            return (
                f"Hybrid analysis marked this {subject} as {risk_level.lower()} risk because both "
                f"the ML model and rule-based checks detected phishing-like behaviour."
            )
        if ml_score is not None:
            return f"The ML model drove a {risk_level.lower()}-risk phishing decision for this {subject}."
        return f"Rule-based checks marked this {subject} as {risk_level.lower()} risk."

    if ml_score is not None:
        return (
            f"This {subject} looks legitimate overall. The ML model and rule-based checks did not "
            f"find enough phishing evidence to push the risk beyond {risk_level.lower()}."
        )
    return f"This {subject} looks legitimate overall based on the current rule-based checks."


def recommended_action(*, channel: str, label: str, risk_level: str) -> str:
    subject = "message" if channel in {"sms", "social", "email"} else "URL"

    if label == "phishing":
        if channel == "url":
            return "Do not open the link. Keep it blocked, and only visit the official site by typing the address manually."
        if channel == "email":
            return "Do not click links, download attachments, or reply. Verify the sender through an official contact channel first."
        if channel == "sms":
            return "Do not tap the link or reply to the message. Contact the organisation through its official website or phone number."
        return "Avoid engaging with the message or its links. Confirm the request through an official channel before taking any action."

    if risk_level in {"MEDIUM", "HIGH"}:
        return f"Treat this {subject} carefully. Double-check the sender, destination, or request before trusting it."

    return f"No strong phishing evidence was found, but you should still verify unusual requests before acting on them."


def recommended_action_steps(*, channel: str, label: str, risk_level: str) -> list[str]:
    if label == "phishing":
        if channel == "url":
            return [
                "Do not open the link from the message.",
                "Type the official website address manually instead.",
                "Report or block the suspicious link if it came from email, SMS, or social media.",
            ]
        if channel == "email":
            return [
                "Do not click links, download attachments, or reply.",
                "Verify the sender through an official contact channel.",
                "Report the email to your security team or mail provider.",
            ]
        if channel == "sms":
            return [
                "Do not tap links or reply to the SMS.",
                "Contact the organisation using its official website or phone number.",
                "Delete or report the message if it claims prizes, parcels, banking, or urgent verification.",
            ]
        return [
            "Do not engage with the account, message, or links.",
            "Verify the request through the official profile or website.",
            "Report impersonation, giveaway, crypto, or support scams on the platform.",
        ]

    if risk_level in {"MEDIUM", "HIGH"}:
        return [
            "Pause before taking action.",
            "Verify the sender and destination through an official channel.",
            "Avoid sharing passwords, payment details, or verification codes.",
        ]

    return [
        "No strong phishing evidence was found.",
        "Still verify unusual requests before clicking, replying, or sharing information.",
    ]


def public_risk_factors(indicators: list[dict]) -> list[str]:
    factors = [
        f"{indicator['title']}: {indicator['detail']}"
        for indicator in indicators
        if indicator.get("impact", 0) > 0 or indicator.get("source") == "ml"
    ]
    if factors:
        return factors[:6]
    return ["No strong phishing indicators were detected."]


def build_scan_response(
    *,
    channel: str,
    rule_indicators: list[dict],
    ml_signal: dict | None = None,
    platform: str | None = None,
) -> dict:
    ordered_rule_indicators = sorted(
        rule_indicators,
        key=lambda indicator: indicator["impact"],
        reverse=True,
    )
    rule_score = clamp_score(sum(indicator["impact"] for indicator in ordered_rule_indicators))
    ml_score = ml_signal["score"] if ml_signal is not None else None
    base_threat_score, ml_impact = blend_scores(ml_score, rule_score)
    threat_score, phishing_threshold = apply_channel_tuning(
        channel=channel,
        final_score=base_threat_score,
        ml_score=ml_score,
        rule_score=rule_score,
    )
    label = determine_label(
        threat_score,
        ml_score,
        rule_score,
        phishing_threshold=phishing_threshold,
    )
    risk_level = risk_level_from_score(threat_score)
    confidence = confidence_from_components(
        final_score=threat_score,
        label=label,
        ml_score=ml_score,
        rule_score=rule_score,
        decision_boundary=phishing_threshold,
    )

    indicators = ordered_rule_indicators.copy()
    if ml_signal is not None:
        indicators.insert(
            0,
            {
                "source": "ml",
                "title": ml_signal["title"],
                "detail": ml_signal["detail"],
                "impact": ml_impact,
                "severity": severity_from_impact(ml_impact),
            },
        )

    if not indicators:
        indicators = [
            build_rule_indicator(
                title="No strong phishing indicators",
                detail="No strong phishing indicators were detected.",
                impact=0,
            )
        ]

    reasons = [indicator["detail"] for indicator in indicators]

    summary = summarize_assessment(
        channel=channel,
        label=label,
        risk_level=risk_level,
        ml_score=ml_score,
        rule_score=rule_score,
    )
    recommendation = recommended_action(
        channel=channel,
        label=label,
        risk_level=risk_level,
    )

    return {
        "prediction": label,
        "label": label,
        "confidence": confidence,
        "threat_score": threat_score,
        "ml_score": ml_score,
        "rule_score": rule_score,
        "risk_level": risk_level,
        "channel": channel,
        "platform": platform,
        "reasons": reasons,
        "risk_factors": public_risk_factors(indicators),
        "explanation": summary,
        "recommended_actions": recommended_action_steps(
            channel=channel,
            label=label,
            risk_level=risk_level,
        ),
        "summary": summary,
        "recommendation": recommendation,
        "indicators": indicators,
    }
