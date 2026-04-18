import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDemoGuide } from "../hooks/useDemoGuide";

const pageMeta = {
  "/": {
    eyebrow: "Overview",
    title: "Threat Command Dashboard",
    subtitle: "Track scanning pressure, response trends, and phishing exposure across every channel.",
    tag: "Live telemetry"
  },
  "/scan/url": {
    eyebrow: "Scanner",
    title: "URL Intercept Studio",
    subtitle: "Probe suspicious destinations with layered checks, brand cues, and link hygiene indicators.",
    tag: "Link triage"
  },
  "/scan/email": {
    eyebrow: "Scanner",
    title: "Email Evidence Lab",
    subtitle: "Test sender behaviour, subject pressure, and body content in one explainable analysis flow.",
    tag: "Inbox defense"
  },
  "/scan/sms": {
    eyebrow: "Scanner",
    title: "SMS Scam Interceptor",
    subtitle: "Inspect short-code abuse, reward bait, urgency language, and hybrid detector signals in real time.",
    tag: "Message triage"
  },
  "/scan/social": {
    eyebrow: "Scanner",
    title: "Social Message Watch",
    subtitle: "Assess support impersonation, giveaway lures, account-takeover prompts, and suspicious links.",
    tag: "Conversation safety"
  },
  "/logs": {
    eyebrow: "Operations",
    title: "Incident Log Stream",
    subtitle: "Search historical detections, inspect prior verdicts, and audit scan behaviour over time.",
    tag: "Audit trail"
  },
  "/analytics": {
    eyebrow: "Operations",
    title: "Detection Analytics",
    subtitle: "Compare channel exposure, risk distribution, and activity velocity from the backend scan history.",
    tag: "Trend lens"
  },
  "/poster": {
    eyebrow: "Presentation",
    title: "Poster & Report",
    subtitle: "Showcase the PhishGuard poster, PDF report, team details, QR access, and live demo resources.",
    tag: "Capstone assets"
  },
  "/settings": {
    eyebrow: "Operations",
    title: "System Settings",
    subtitle: "Review API health, account state, verification readiness, and delivery configuration from a single panel.",
    tag: "Environment"
  },
  "/auth": {
    eyebrow: "Identity",
    title: "Account Access",
    subtitle: "Create a personal PhishGuard workspace, verify your email, and unlock snapshot delivery.",
    tag: "User access"
  },
  "/verify-email": {
    eyebrow: "Identity",
    title: "Email Verification",
    subtitle: "Confirm account ownership so personal scan snapshots can be mailed safely.",
    tag: "Trust step"
  }
};

function Topbar() {
  const location = useLocation();
  const { user, isVerified, signOut, resendVerification } = useAuth();
  const { isActive, isPaused, resumeGuide, startGuide } = useDemoGuide();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const appPath = location.pathname.replace(/^\/app(?=\/|$)/, "") || "/";
  const meta = pageMeta[appPath] || {
    eyebrow: "Workspace",
    title: "PhishGuard",
    subtitle: "Hybrid phishing analysis across URL, email, SMS, and social content.",
    tag: "Operator view"
  };

  const handleResend = async () => {
    setBusy(true);
    try {
      const response = await resendVerification();
      setNotice(
        response.delivery_mode === "preview"
          ? "Verification email prepared in preview mode."
          : response.message
      );
    } catch (error) {
      setNotice(
        error?.response?.data?.detail || "Could not resend verification right now."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="topbar">
      <div>
        <p className="topbar-eyebrow">{meta.eyebrow}</p>
        <h2 className="page-title">{meta.title}</h2>
        <p className="page-subtitle">{meta.subtitle}</p>
      </div>
      <div className="topbar-actions">
        {notice ? <span className="badge badge-neutral">{notice}</span> : null}
        <button
          id="demo-guide-launcher"
          type="button"
          className="button button-primary button-inline demo-guide-launcher"
          onClick={() => {
            if (isPaused) {
              resumeGuide();
              return;
            }
            startGuide(0);
          }}
        >
          {isActive
            ? "Restart Guided Demo"
            : isPaused
              ? "Resume Guided Demo"
              : "Launch Guided Demo"}
        </button>
        <span className="badge badge-neutral">{meta.tag}</span>
        <span className="badge badge-success">Hybrid scoring active</span>
        {user ? (
          <>
            <span className="badge badge-neutral">{user.full_name}</span>
            <span className={`badge ${isVerified ? "badge-success" : "badge-warning"}`}>
              {isVerified ? "Email verified" : "Verification pending"}
            </span>
            {!isVerified ? (
              <button
                type="button"
                className="button button-secondary button-inline"
                disabled={busy}
                onClick={handleResend}
              >
                {busy ? "Sending..." : "Resend verification"}
              </button>
            ) : null}
            <Link className="button button-secondary topbar-link-button" to="/app/settings">
              Account
            </Link>
            <button
              type="button"
              className="button button-secondary button-inline"
              onClick={signOut}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link className="button button-secondary topbar-link-button" to="/app/auth">
            Create account
          </Link>
        )}
      </div>
    </header>
  );
}

export default Topbar;
