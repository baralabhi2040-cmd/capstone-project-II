import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getLogs, sendSnapshotEmail } from "../api/api";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/formatDate";
import { getRiskBadgeClass } from "../utils/riskLevel";

const initialState = {
  full_name: "",
  email: "",
  password: "",
};

function Auth() {
  const [searchParams] = useSearchParams();
  const { user, loading, signIn, signUp, isVerified, resendVerification } = useAuth();
  const [mode, setMode] = useState("signup");
  const [form, setForm] = useState(initialState);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("");
  const [verificationPreviewUrl, setVerificationPreviewUrl] = useState("");
  const [previewPath, setPreviewPath] = useState("");
  const [recentScans, setRecentScans] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const [resendBusy, setResendBusy] = useState(false);
  const [snapshotBusyId, setSnapshotBusyId] = useState(null);
  const [snapshotMessage, setSnapshotMessage] = useState("");
  const [snapshotError, setSnapshotError] = useState("");
  const verifiedFlag = searchParams.get("verified");

  const applyDeliveryMeta = (response) => {
    setDeliveryMode(response?.delivery_mode || "");
    setVerificationPreviewUrl(response?.verification_preview_url || "");
    setPreviewPath(response?.preview_path || "");
  };

  const loadRecentScans = async () => {
    if (!user) {
      setRecentScans([]);
      return;
    }

    setWorkspaceLoading(true);
    setWorkspaceError("");

    try {
      const data = await getLogs(6);
      setRecentScans(data);
    } catch (requestError) {
      setWorkspaceError(
        requestError?.response?.data?.detail ||
          "We could not load your personal scan history."
      );
    } finally {
      setWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setRecentScans([]);
      setWorkspaceError("");
      setSnapshotMessage("");
      setSnapshotError("");
      return;
    }

    loadRecentScans();
  }, [user?.id]);

  useEffect(() => {
    if (verifiedFlag !== "1") {
      return;
    }

    setError("");
    setVerificationPreviewUrl("");
    setPreviewPath("");
    setMessage(
      user
        ? "Email verified. Snapshot delivery is now enabled for your account."
        : "Email verified. Sign in to continue into your PhishGuard workspace."
    );
  }, [verifiedFlag, user?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    setSnapshotMessage("");
    setSnapshotError("");
    setVerificationPreviewUrl("");
    setPreviewPath("");
    setDeliveryMode("");

    try {
      const response =
        mode === "signup"
          ? await signUp(form)
          : await signIn({ email: form.email, password: form.password });

      setMessage(response.message);
      applyDeliveryMeta(response);
      setForm(initialState);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          `Unable to ${mode === "signup" ? "create your account" : "sign you in"}.`
      );
    } finally {
      setBusy(false);
    }
  };

  const handleResendVerification = async () => {
    setResendBusy(true);
    setError("");
    setMessage("");
    setSnapshotMessage("");
    setSnapshotError("");

    try {
      const response = await resendVerification();
      setMessage(
        response.delivery_mode === "preview"
          ? "Verification email prepared in local preview mode. Open the preview link below to continue testing."
          : response.message
      );
      applyDeliveryMeta(response);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          "Could not resend the verification email right now."
      );
    } finally {
      setResendBusy(false);
    }
  };

  const handleSnapshotEmail = async (scanId) => {
    setSnapshotBusyId(scanId);
    setSnapshotMessage("");
    setSnapshotError("");

    try {
      const response = await sendSnapshotEmail(scanId);
      setSnapshotMessage(
        response.delivery_mode === "preview"
          ? "Snapshot prepared in local preview mode. Use the preview path below to inspect the email output."
          : response.message
      );
      if (response.preview_path) {
        setPreviewPath(response.preview_path);
      }
      await loadRecentScans();
    } catch (requestError) {
      setSnapshotError(
        requestError?.response?.data?.detail ||
          "Could not send the scan snapshot right now."
      );
    } finally {
      setSnapshotBusyId(null);
    }
  };

  if (loading) {
    return <Loader text="Loading your session..." />;
  }

  if (user) {
    const latestScan = recentScans[0] || null;

    return (
      <div className="page-stack">
        <div className="card auth-hero-card">
          <div className="auth-hero-copy">
            <p className="hero-kicker">Account center</p>
            <h3 className="hero-title">
              {isVerified
                ? "Your verified PhishGuard workspace is ready"
                : "Your PhishGuard account is active, but verification is still pending"}
            </h3>
            <p className="hero-description">
              Signed in as {user.full_name}. New scans are saved into your private history, and verified accounts can send structured scan snapshots to their own inbox.
            </p>
          </div>
          <div className="auth-status-grid">
            <div className="hero-metric">
              <p className="small">Mailbox</p>
              <h4 className="auth-metric-title">{user.email}</h4>
              <p className="small">
                This is the address PhishGuard uses for verification and snapshot delivery.
              </p>
            </div>
            <div className="hero-metric">
              <p className="small">Verification state</p>
              <h4>{isVerified ? "Verified" : "Pending"}</h4>
              <p className="small">
                {isVerified
                  ? "Snapshot delivery is unlocked for your account."
                  : "Verify your email before requesting scan snapshots."}
              </p>
            </div>
          </div>
        </div>

        <div className={`card auth-status-card ${isVerified ? "auth-status-card-success" : "auth-status-card-warning"}`}>
          <div className="auth-status-card-copy">
            <p className="hero-kicker">{isVerified ? "Snapshot delivery unlocked" : "Verify next"}</p>
            <h3 className="auth-status-card-title">
              {isVerified
                ? "Your account can now receive scan snapshots by email"
                : "Check your email and verify this account before you request snapshots"}
            </h3>
            <p className="hero-description">
              {isVerified
                ? "You can scan from any lane and email saved results back to your verified mailbox from the result card, logs, or this account workspace."
                : `We created the account for ${user.email}. The next step is verifying mailbox ownership so PhishGuard can safely send personal scan snapshots.`}
            </p>
            <div className="row wrap">
              {!isVerified ? (
                <button
                  type="button"
                  className="button button-primary"
                  disabled={resendBusy}
                  onClick={handleResendVerification}
                >
                  {resendBusy ? "Sending verification..." : "Resend verification email"}
                </button>
              ) : null}
              <Link className="button button-secondary topbar-link-button" to="/app/scan/email">
                Start scanning
              </Link>
              <Link className="button button-secondary topbar-link-button" to="/app/logs">
                Open private history
              </Link>
            </div>
          </div>
          <div className="auth-step-list">
            <div className="indicator-item">
              <p className="indicator-title">Step 1</p>
              <p className="indicator-detail">Create or sign in to your private PhishGuard identity.</p>
            </div>
            <div className="indicator-item">
              <p className="indicator-title">Step 2</p>
              <p className="indicator-detail">
                {isVerified
                  ? "Mailbox ownership confirmed. Snapshot emails are enabled."
                  : "Verify the account from your email inbox before using snapshot delivery."}
              </p>
            </div>
            <div className="indicator-item">
              <p className="indicator-title">Step 3</p>
              <p className="indicator-detail">Run scans while signed in so each result is saved to your personal history.</p>
            </div>
          </div>
        </div>

        {message ? <div className="auth-success">{message}</div> : null}
        {error ? <div className="error-text">{error}</div> : null}

        {verificationPreviewUrl ? (
          <div className="code-box">
            <strong>Local verification preview</strong>
            <p className="small" style={{ margin: "8px 0 0" }}>
              SMTP is not configured, so PhishGuard prepared the verification flow in preview mode. Use this local link to continue testing.
            </p>
            <div style={{ marginTop: 8 }}>
              <a href={verificationPreviewUrl}>{verificationPreviewUrl}</a>
            </div>
            {previewPath ? <p className="small" style={{ marginTop: 8 }}>{previewPath}</p> : null}
          </div>
        ) : null}

        <div className="grid-2 auth-layout">
          <div className="card auth-feature-card">
            <p className="hero-kicker">Account checklist</p>
            <h3 style={{ marginTop: 6 }}>
              {isVerified
                ? "You are ready to collect and export personal detections"
                : "Finish verification, then start building your private scan history"}
            </h3>
            <div className="auth-feature-list">
              <div className="indicator-item">
                <p className="indicator-title">Own your detections</p>
                <p className="indicator-detail">
                  Each signed-in scan is stored under your account instead of a shared guest workspace.
                </p>
              </div>
              <div className="indicator-item">
                <p className="indicator-title">Verify before delivery</p>
                <p className="indicator-detail">
                  {isVerified
                    ? "Your mailbox is already verified, so snapshot delivery is available."
                    : "Snapshot emailing stays locked until the account owner confirms the mailbox."}
                </p>
              </div>
              <div className="indicator-item">
                <p className="indicator-title">Keep an evidence trail</p>
                <p className="indicator-detail">
                  Use private logs plus email snapshots to build a clearer investigation record for yourself.
                </p>
              </div>
            </div>
          </div>

          <div className="card auth-form-card">
            <div className="form-header">
              <div>
                <p className="hero-kicker">Latest saved scan</p>
                <h3 style={{ margin: "6px 0 0" }}>
                  {latestScan ? "Your most recent private detection" : "No personal scans saved yet"}
                </h3>
              </div>
              {latestScan ? (
                <span className={`badge ${getRiskBadgeClass(latestScan.risk_level)}`}>
                  {latestScan.risk_level}
                </span>
              ) : null}
            </div>

            {workspaceLoading ? (
              <Loader text="Loading your saved scans..." />
            ) : workspaceError ? (
              <div className="error-text">{workspaceError}</div>
            ) : latestScan ? (
              <div className="account-scan-highlight">
                <div className="result-grid">
                  <div>
                    <p className="small">Channel</p>
                    <p>{latestScan.scan_type}</p>
                  </div>
                  <div>
                    <p className="small">Threat score</p>
                    <p>{latestScan.threat_score}/100</p>
                  </div>
                  <div>
                    <p className="small">Verdict</p>
                    <p>{latestScan.label}</p>
                  </div>
                  <div>
                    <p className="small">Captured</p>
                    <p>{formatDate(latestScan.created_at)}</p>
                  </div>
                </div>
                <div className="indicator-item" style={{ marginTop: 14 }}>
                  <p className="indicator-title">Summary</p>
                  <p className="indicator-detail">{latestScan.summary}</p>
                </div>
                <div className="result-action-panel">
                  <div>
                    <p className="small strong">Snapshot status</p>
                    <p className="small" style={{ margin: "6px 0 0" }}>
                      {latestScan.snapshot_sent_at
                        ? `Last sent ${formatDate(latestScan.snapshot_sent_at)}`
                        : isVerified
                        ? "This saved scan is ready to be emailed to your verified inbox."
                        : "Verify your account before emailing this saved scan to yourself."}
                    </p>
                  </div>
                  <div className="row wrap">
                    {isVerified ? (
                      <button
                        type="button"
                        className="button button-primary"
                        disabled={snapshotBusyId === latestScan.id}
                        onClick={() => handleSnapshotEmail(latestScan.id)}
                      >
                        {snapshotBusyId === latestScan.id
                          ? "Sending snapshot..."
                          : "Email latest snapshot"}
                      </button>
                    ) : (
                      <Link className="button button-secondary topbar-link-button" to="/app/settings">
                        Open verification settings
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="account-empty-state">
                <p className="small">
                  Run a scan while signed in and it will appear here as a saved snapshot candidate.
                </p>
                <div className="row wrap" style={{ marginTop: 14 }}>
                  <Link className="button button-primary topbar-link-button" to="/app/scan/email">
                    Scan Email
                  </Link>
                  <Link className="button button-secondary topbar-link-button" to="/app/scan/sms">
                    Scan SMS
                  </Link>
                  <Link className="button button-secondary topbar-link-button" to="/app/scan/url">
                    Scan URL
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {recentScans.length > 0 ? (
          <div className="card">
            <div className="form-header">
              <div>
                <p className="hero-kicker">Recent personal scans</p>
                <h3 style={{ margin: "6px 0 0" }}>Saved results ready for review or snapshot delivery</h3>
              </div>
              <Link className="button button-secondary topbar-link-button" to="/app/logs">
                View full history
              </Link>
            </div>

            <div className="account-scan-list">
              {recentScans.map((scan) => (
                <div key={scan.id} className="account-scan-card">
                  <div className="row-between wrap">
                    <div>
                      <p className="indicator-title">
                        {scan.scan_type.toUpperCase()} scan #{scan.id}
                      </p>
                      <p className="small" style={{ marginTop: 6 }}>
                        {formatDate(scan.created_at)}
                      </p>
                    </div>
                    <div className="row wrap">
                      <span className={`badge ${scan.label === "phishing" ? "badge-danger" : "badge-success"}`}>
                        {scan.label}
                      </span>
                      <span className={`badge ${getRiskBadgeClass(scan.risk_level)}`}>
                        {scan.risk_level}
                      </span>
                    </div>
                  </div>
                  <p className="small" style={{ marginTop: 12 }}>
                    {scan.summary}
                  </p>
                  <div className="result-grid compact" style={{ marginTop: 14 }}>
                    <div>
                      <p className="small">Threat score</p>
                      <p>{scan.threat_score}/100</p>
                    </div>
                    <div>
                      <p className="small">Rule score</p>
                      <p>{scan.rule_score}/100</p>
                    </div>
                    <div>
                      <p className="small">ML score</p>
                      <p>{scan.ml_score == null ? "Unavailable" : `${scan.ml_score}/100`}</p>
                    </div>
                    <div>
                      <p className="small">Snapshot</p>
                      <p>{scan.snapshot_sent_at ? formatDate(scan.snapshot_sent_at) : "Not sent yet"}</p>
                    </div>
                  </div>
                  <div className="row wrap" style={{ marginTop: 16 }}>
                    {isVerified ? (
                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={snapshotBusyId === scan.id}
                        onClick={() => handleSnapshotEmail(scan.id)}
                      >
                        {snapshotBusyId === scan.id ? "Sending..." : "Email snapshot"}
                      </button>
                    ) : (
                      <span className="badge badge-warning">Verify to email snapshots</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {snapshotMessage ? <div className="auth-success">{snapshotMessage}</div> : null}
        {snapshotError ? <div className="error-text">{snapshotError}</div> : null}
        {snapshotMessage && previewPath ? (
          <div className="code-box">
            <strong>Local snapshot preview path</strong>
            <p className="small" style={{ margin: "8px 0 0" }}>{previewPath}</p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="card auth-hero-card">
        <div className="auth-hero-copy">
          <p className="hero-kicker">Live account system</p>
          <h3 className="hero-title">Create a real PhishGuard identity for personal scan history</h3>
          <p className="hero-description">
            Sign up to verify your email, keep your own scan timeline, and mail yourself formatted phishing snapshots after detection.
          </p>
        </div>
        <div className="auth-status-grid">
          <div className="hero-metric">
            <p className="small">What you unlock</p>
            <h4>Private history</h4>
            <p className="small">Signed-in scans stay tied to your account instead of a shared guest history.</p>
          </div>
          <div className="hero-metric">
            <p className="small">Delivery flow</p>
            <h4>Email snapshots</h4>
            <p className="small">Verified users can send saved scan summaries directly to their own inbox.</p>
          </div>
        </div>
      </div>

      <div className="grid-2 auth-layout">
        <div className="card auth-feature-card">
          <p className="hero-kicker">Why accounts matter</p>
          <h3 style={{ marginTop: 6 }}>Turn the scanner into a personal security portal</h3>
          <div className="auth-feature-list">
            <div className="indicator-item">
              <p className="indicator-title">Own your detections</p>
              <p className="indicator-detail">Logs and analytics can follow the signed-in user instead of mixing everyone together.</p>
            </div>
            <div className="indicator-item">
              <p className="indicator-title">Verify before delivery</p>
              <p className="indicator-detail">Snapshot emailing stays locked until the account owner confirms the mailbox.</p>
            </div>
            <div className="indicator-item">
              <p className="indicator-title">Build a more legitimate product</p>
              <p className="indicator-detail">This creates the feel of a real phishing-monitoring service instead of a one-page demo.</p>
            </div>
          </div>
        </div>

        <form className="card form-grid auth-form-card" onSubmit={handleSubmit}>
          <div className="segmented-control auth-tab-row" role="tablist" aria-label="Account mode">
            <button
              type="button"
              className={`segmented-control-button${mode === "signup" ? " active" : ""}`}
              aria-selected={mode === "signup"}
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
              }}
            >
              Create account
            </button>
            <button
              type="button"
              className={`segmented-control-button${mode === "login" ? " active" : ""}`}
              aria-selected={mode === "login"}
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
            >
              Sign in
            </button>
          </div>

          {mode === "signup" ? (
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                type="text"
                placeholder="Prabin Bista"
                value={form.full_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, full_name: event.target.value }))
                }
              />
            </div>
          ) : null}

          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
            />
          </div>

          <div className="helper-row">
            <p className="small">
              {mode === "signup"
                ? "After signup, verify your email before requesting snapshot delivery."
                : "Sign in to access your personal scan history and account tools."}
            </p>
            <p className="small">{mode === "signup" ? "New account" : "Existing account"}</p>
          </div>

          <button className="button button-primary" type="submit" disabled={busy}>
            {busy
              ? mode === "signup"
                ? "Creating account..."
                : "Signing in..."
              : mode === "signup"
              ? "Create my account"
              : "Sign in"}
          </button>

          {message ? <div className="auth-success">{message}</div> : null}
          {error ? <div className="error-text">{error}</div> : null}
          {verificationPreviewUrl ? (
            <div className="code-box">
              <strong>Verification preview link</strong>
              <div style={{ marginTop: 8 }}>
                <a href={verificationPreviewUrl}>{verificationPreviewUrl}</a>
              </div>
              {previewPath ? <p className="small" style={{ marginTop: 8 }}>{previewPath}</p> : null}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}

export default Auth;
