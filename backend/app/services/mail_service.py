from __future__ import annotations

import json
import smtplib
from datetime import UTC, datetime
from email.message import EmailMessage
from html import escape
from pathlib import Path

from app.core.config import settings
from app.models.scan_log import ScanLog
from app.models.user import User


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_from_email)


def email_delivery_mode() -> str:
    return "smtp" if smtp_configured() else "preview"


def build_verification_link(token: str) -> str:
    if email_delivery_mode() == "preview" and not settings.serve_frontend:
        return f"{settings.public_base_url}/auth/verify-page?token={token}"
    return f"{settings.frontend_base_url}/verify-email?token={token}"


def _append_outbox_preview(
    *,
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str,
    meta: dict | None = None,
) -> str:
    timestamp = utcnow().strftime("%Y%m%d-%H%M%S")
    preview_path = Path(settings.outbox_dir) / f"{timestamp}-{to_email.replace('@', '_at_')}.json"
    payload = {
        "timestamp": utcnow().isoformat(),
        "mode": "preview",
        "to": to_email,
        "subject": subject,
        "text": text_body,
        "html": html_body,
        "meta": meta or {},
    }
    preview_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    with open(settings.outbox_file, "a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload) + "\n")
    return preview_path.as_posix()


def send_email(
    *,
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str,
    meta: dict | None = None,
) -> dict:
    if not smtp_configured():
        preview_path = _append_outbox_preview(
            to_email=to_email,
            subject=subject,
            text_body=text_body,
            html_body=html_body,
            meta=meta,
        )
        return {"mode": "preview", "preview_path": preview_path}

    message = EmailMessage()
    sender_name = settings.smtp_from_name or "PhishGuard"
    message["From"] = f"{sender_name} <{settings.smtp_from_email}>"
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    try:
        smtp_factory = smtplib.SMTP_SSL if settings.smtp_use_ssl else smtplib.SMTP
        with smtp_factory(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
            if settings.smtp_use_tls and not settings.smtp_use_ssl:
                smtp.starttls()
            if settings.smtp_username and settings.smtp_password:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)
    except Exception:
        if settings.email_debug_preview:
            preview_path = _append_outbox_preview(
                to_email=to_email,
                subject=subject,
                text_body=text_body,
                html_body=html_body,
                meta={
                    **(meta or {}),
                    "smtp_fallback": True,
                },
            )
            return {"mode": "preview", "preview_path": preview_path}
        raise

    return {"mode": "smtp", "preview_path": None}


def send_verification_email(user: User, token: str) -> dict:
    verification_link = build_verification_link(token)
    safe_name = escape(user.full_name)
    safe_link = escape(verification_link)

    subject = "Verify your PhishGuard account"
    text_body = (
        f"Hello {user.full_name},\n\n"
        "Welcome to PhishGuard. Please verify your email address so you can "
        "receive scan snapshots and secure your account.\n\n"
        f"Verify now: {verification_link}\n\n"
        "If you did not create this account, you can ignore this email."
    )
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background: #08111f; color: #e8f0ff; padding: 24px;">
        <div style="max-width: 640px; margin: 0 auto; background: #101b2e; border: 1px solid #223252; border-radius: 18px; padding: 28px;">
          <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #8fb7ff;">PhishGuard account security</p>
          <h1 style="margin: 0 0 12px; font-size: 28px;">Verify your email</h1>
          <p style="line-height: 1.6; color: #dbe6ff;">Hello {safe_name}, your PhishGuard account is almost ready. Verify your email to unlock personal scan history and snapshot delivery.</p>
          <p style="margin: 24px 0;">
            <a href="{safe_link}" style="display: inline-block; padding: 14px 20px; border-radius: 12px; background: linear-gradient(90deg, #59d3c2, #6cb4ff); color: #061118; text-decoration: none; font-weight: 700;">Verify email</a>
          </p>
          <p style="line-height: 1.6; color: #9fb1d1;">If the button does not open, copy this link into your browser:<br>{safe_link}</p>
        </div>
      </body>
    </html>
    """.strip()

    delivery = send_email(
        to_email=user.email,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
        meta={"type": "verification", "verification_link": verification_link},
    )
    delivery["verification_link"] = verification_link
    return delivery


def send_scan_snapshot_email(user: User, scan_log: ScanLog) -> dict:
    safe_name = escape(user.full_name)
    label = escape(scan_log.label.upper())
    risk_level = escape(scan_log.risk_level)
    summary = escape(scan_log.summary)
    recommendation = escape(scan_log.recommendation)
    input_preview = escape(scan_log.input_text[:1200])
    created_at = scan_log.created_at.strftime("%Y-%m-%d %H:%M UTC")

    try:
        indicators = json.loads(scan_log.indicators or "[]")
    except json.JSONDecodeError:
        indicators = []

    highlighted = indicators[:5]
    indicator_lines = "\n".join(
        f"- {item.get('title', 'Indicator')}: {item.get('detail', '')}"
        for item in highlighted
    ) or "- No additional indicators were stored for this scan."

    indicator_html = "".join(
        f"<li style='margin-bottom: 10px;'><strong>{escape(item.get('title', 'Indicator'))}</strong><br>{escape(item.get('detail', ''))}</li>"
        for item in highlighted
    ) or "<li>No additional indicators were stored for this scan.</li>"

    subject = f"Your PhishGuard {scan_log.scan_type.upper()} scan snapshot"
    text_body = (
        f"Hello {user.full_name},\n\n"
        f"Here is your {scan_log.scan_type} scan snapshot from {created_at}.\n\n"
        f"Verdict: {scan_log.label.upper()}\n"
        f"Risk level: {scan_log.risk_level}\n"
        f"Threat score: {scan_log.threat_score}/100\n"
        f"ML score: {scan_log.ml_score if scan_log.ml_score is not None else 'Unavailable'}/100\n"
        f"Rule score: {scan_log.rule_score}/100\n\n"
        f"Summary: {scan_log.summary}\n"
        f"Recommendation: {scan_log.recommendation}\n\n"
        f"Top indicators:\n{indicator_lines}\n\n"
        f"Input preview:\n{scan_log.input_text[:1200]}"
    )
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background: #08111f; color: #e8f0ff; padding: 24px;">
        <div style="max-width: 720px; margin: 0 auto; background: #101b2e; border: 1px solid #223252; border-radius: 18px; padding: 28px;">
          <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #8fb7ff;">Personal detection snapshot</p>
          <h1 style="margin: 0 0 12px; font-size: 28px;">Your scan result is ready</h1>
          <p style="line-height: 1.6; color: #dbe6ff;">Hello {safe_name}, here is your saved {escape(scan_log.scan_type)} analysis snapshot from {escape(created_at)}.</p>
          <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 22px 0;">
            <div style="background: #13223a; border-radius: 14px; padding: 14px;"><div style="color: #95a7c9; font-size: 12px;">Verdict</div><div style="font-size: 24px; font-weight: 700;">{label}</div></div>
            <div style="background: #13223a; border-radius: 14px; padding: 14px;"><div style="color: #95a7c9; font-size: 12px;">Threat score</div><div style="font-size: 24px; font-weight: 700;">{scan_log.threat_score}/100</div></div>
            <div style="background: #13223a; border-radius: 14px; padding: 14px;"><div style="color: #95a7c9; font-size: 12px;">Risk level</div><div style="font-size: 24px; font-weight: 700;">{risk_level}</div></div>
          </div>
          <p style="line-height: 1.6; color: #dbe6ff;"><strong>Summary:</strong> {summary}</p>
          <p style="line-height: 1.6; color: #dbe6ff;"><strong>Recommended action:</strong> {recommendation}</p>
          <div style="margin-top: 20px; padding: 16px; border-radius: 14px; background: #0c1729; border: 1px solid #223252;">
            <p style="margin: 0 0 10px; font-weight: 700;">Top indicators</p>
            <ul style="padding-left: 18px; color: #dbe6ff;">{indicator_html}</ul>
          </div>
          <div style="margin-top: 20px; padding: 16px; border-radius: 14px; background: #0c1729; border: 1px solid #223252;">
            <p style="margin: 0 0 10px; font-weight: 700;">Input preview</p>
            <pre style="white-space: pre-wrap; margin: 0; color: #cfe0ff;">{input_preview}</pre>
          </div>
        </div>
      </body>
    </html>
    """.strip()

    return send_email(
        to_email=user.email,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
        meta={
            "type": "snapshot",
            "scan_id": scan_log.id,
            "scan_type": scan_log.scan_type,
        },
    )
