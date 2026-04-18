function formatScore(score) {
  return Number.isFinite(score) ? `${score}/100` : "Unavailable";
}

function RiskMeter({ score = 0, mlScore = null, ruleScore = 0 }) {
  const safeScore = Math.max(0, Math.min(100, score));

  let tone = "low";
  let label = "Safe";
  if (safeScore >= 70) {
    tone = "high";
    label = "Phishing";
  } else if (safeScore >= 40) {
    tone = "medium";
    label = "Suspicious";
  }

  return (
    <div className={`risk-meter-card risk-${tone}`}>
      <div className="row-between wrap">
        <div>
          <p className="small strong" style={{ margin: 0 }}>
            Visual risk meter
          </p>
          <p className="small" style={{ margin: "4px 0 0" }}>
            Green means safe, yellow means suspicious, and red means phishing.
          </p>
        </div>
        <span className={`badge risk-meter-badge badge-${tone === "high" ? "danger" : tone === "medium" ? "warning" : "success"}`}>
          {label}
        </span>
      </div>

      <div className="risk-gauge-row">
        <div className="risk-gauge-orb">
          <span>{safeScore}</span>
          <small>/100</small>
        </div>
        <div className="risk-meter-stack">
          <div className="risk-meter">
            <div
              className={`risk-fill meter-${tone}`}
              style={{ width: `${safeScore}%` }}
            />
          </div>
          <div className="risk-meter-scale">
            <span>Safe</span>
            <span>Suspicious</span>
            <span>Phishing</span>
          </div>
        </div>
      </div>

      <div className="score-breakdown-grid">
        <div className="score-breakdown-card">
          <p className="small">ML score</p>
          <p className="score-breakdown-value">{formatScore(mlScore)}</p>
        </div>
        <div className="score-breakdown-card">
          <p className="small">Rule score</p>
          <p className="score-breakdown-value">{formatScore(ruleScore)}</p>
        </div>
      </div>
    </div>
  );
}

export default RiskMeter;
