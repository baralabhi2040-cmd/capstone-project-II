import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { sendSnapshotEmail } from "../api/api";
import { useAuth } from "../context/AuthContext";
import RiskMeter from "./RiskMeter";
import ScanExplanationPanel from "./ScanExplanationPanel";
import SuspiciousContentHighlighter from "./SuspiciousContentHighlighter";

function ScanResultCard({ result, inputSummary = null }) {
  const { user, isVerified } = useAuth();
  const [snapshotState, setSnapshotState] = useState("");
  const [snapshotError, setSnapshotError] = useState("");
  const [sendingSnapshot, setSendingSnapshot] = useState(false);
  const [snapshotPreviewPath, setSnapshotPreviewPath] = useState("");

  useEffect(() => {
    setSnapshotState("");
    setSnapshotError("");
    setSendingSnapshot(false);
    setSnapshotPreviewPath("");
  }, [result]);

  if (!result) {
    return (
      <div id="scan-result-card" className="card scan-result-placeholder">
        <p className="muted">No scan result yet.</p>
        <p className="small" style={{ marginTop: 8 }}>
          Run a scan to unlock the verdict, threat score, indicators, and guided explanation panel.
        </p>
      </div>
    );
  }

  const confidence = Math.round((result.confidence || 0) * 100);
  const indicators = result.indicators || [];
  const visibleIndicators = indicators.slice(0, 6);
  const riskFactors = result.risk_factors || [];
  const explanation = result.explanation || result.summary;
  const recommendedActions = result.recommended_actions?.length
    ? result.recommended_actions
    : [result.recommendation].filter(Boolean);
  const riskBadgeClass =
    result.risk_level === "CRITICAL" || result.risk_level === "HIGH"
      ? "badge-danger"
      : result.risk_level === "MEDIUM"
      ? "badge-warning"
      : "badge-success";
  const canEmailSnapshot = Boolean(
    result.scan_id && result.saved_to_account && user && isVerified
  );

  const handleSnapshotEmail = async () => {
    if (!result.scan_id) {
      return;
    }

    setSendingSnapshot(true);
    setSnapshotError("");
    setSnapshotState("");

    try {
      const response = await sendSnapshotEmail(result.scan_id);
      setSnapshotPreviewPath(response.preview_path || "");
      setSnapshotState(
        response.delivery_mode === "preview"
          ? "Snapshot prepared in local email preview mode."
          : response.message
      );
    } catch (error) {
      setSnapshotError(
        error?.response?.data?.detail || "Failed to send the snapshot email."
      );
    } finally {
      setSendingSnapshot(false);
    }
  };

  return (
    <div id="scan-result-card" className="card">
      <div className="result-header">
        <div>
          <p className="small result-eyebrow">Hybrid verdict</p>
          <h3 style={{ margin: "6px 0 8px" }}>Scan Result</h3>
          <p className="result-summary">{explanation}</p>
        </div>
        <div className="result-badge-stack">
          <span
            className={`badge ${
              result.label === "phishing" ? "badge-danger" : "badge-success"
            }`}
          >
            {result.label}
          </span>
          <span className={`badge ${riskBadgeClass}`}>{result.risk_level}</span>
        </div>
      </div>

      <div className="result-grid">
        <div>
          <p className="small">Channel</p>
          <p>{result.channel}</p>
        </div>
        <div>
          <p className="small">Threat score</p>
          <p>{result.threat_score}/100</p>
        </div>
        <div>
          <p className="small">Confidence</p>
          <p>{confidence}%</p>
        </div>
        <div>
          <p className="small">ML score</p>
          <p>{result.ml_score == null ? "Unavailable" : `${result.ml_score}/100`}</p>
        </div>
        <div>
          <p className="small">Rule score</p>
          <p>{result.rule_score}/100</p>
        </div>
        {result.platform ? (
          <div>
            <p className="small">Platform</p>
            <p>{result.platform}</p>
          </div>
        ) : null}
      </div>

      <div id="threat-score-panel">
        <RiskMeter
          score={result.threat_score}
          mlScore={result.ml_score}
          ruleScore={result.rule_score}
        />
      </div>

      <SuspiciousContentHighlighter result={result} inputSummary={inputSummary} />

      <div className="result-detail-grid">
        <div id="risk-indicators-panel" className="insight-panel">
          <p className="small strong">Why it was flagged</p>
          <div className="indicator-list">
            {visibleIndicators.map((indicator, index) => (
              <div key={`${indicator.title}-${index}`} className="indicator-item">
                <div className="row-between wrap">
                  <p className="indicator-title">{indicator.title}</p>
                  <span className={`badge ${indicator.source === "ml" ? "badge-neutral" : "badge-warning"}`}>
                    {indicator.source === "ml" ? "ML" : "Rule"}
                  </span>
                </div>
                <p className="indicator-detail">{indicator.detail}</p>
              </div>
            ))}
            {!visibleIndicators.length && riskFactors.length ? (
              riskFactors.slice(0, 5).map((factor) => (
                <div key={factor} className="indicator-item">
                  <p className="indicator-title">Risk factor</p>
                  <p className="indicator-detail">{factor}</p>
                </div>
              ))
            ) : null}
          </div>
        </div>

        <div id="recommended-action-panel" className="insight-panel recommendation-panel">
          <p className="small strong">Recommended action</p>
          {recommendedActions.length > 1 ? (
            <ul className="recommendation-list">
              {recommendedActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          ) : (
            <p className="recommendation-text">{result.recommendation}</p>
          )}
          <div className="recommendation-note">
            <p className="small" style={{ margin: 0 }}>
              The final score is a hybrid result: the ML model looks for phishing-like patterns,
              while the rule engine checks links, urgency, impersonation, and other explainable indicators.
            </p>
          </div>
        </div>
      </div>

      <ScanExplanationPanel result={result} inputSummary={inputSummary} />

      <div className="result-action-panel">
        <div>
          <p className="small strong">Personal snapshot</p>
          <p className="small" style={{ margin: "6px 0 0" }}>
            {user
              ? isVerified
                ? result.saved_to_account
                  ? "Email this saved scan snapshot back to your verified account mailbox."
                  : "This result was not saved to your account. Run the scan again while signed in to email it later."
                : "Verify your email first, then you can mail this snapshot to yourself."
              : "Create an account to save scans privately and email snapshots to yourself."}
          </p>
        </div>
        <div className="row wrap">
          {user ? (
            <span className="badge badge-neutral">{user.email}</span>
          ) : null}
          {canEmailSnapshot ? (
            <button
              type="button"
              className="button button-primary"
              onClick={handleSnapshotEmail}
              disabled={sendingSnapshot}
            >
              {sendingSnapshot ? "Sending snapshot..." : "Email this snapshot"}
            </button>
          ) : (
            <Link className="button button-secondary topbar-link-button" to={user ? "/app/settings" : "/app/auth"}>
              {user ? "Open verification settings" : "Create account"}
            </Link>
          )}
        </div>
      </div>

      {snapshotState ? <div className="auth-success">{snapshotState}</div> : null}
      {snapshotError ? <div className="error-text">{snapshotError}</div> : null}
      {snapshotState && snapshotPreviewPath ? (
        <div className="code-box">
          <strong>Local snapshot preview path</strong>
          <p className="small" style={{ margin: "8px 0 0" }}>{snapshotPreviewPath}</p>
        </div>
      ) : null}
    </div>
  );
}

export default ScanResultCard;
