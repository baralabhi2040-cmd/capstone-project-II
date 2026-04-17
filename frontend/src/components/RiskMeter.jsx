function formatScore(score) {
  return Number.isFinite(score) ? `${score}/100` : "Unavailable";
}

function RiskMeter({ score = 0, mlScore = null, ruleScore = 0 }) {
  const safeScore = Math.max(0, Math.min(100, score));

  let className = "risk-fill meter-low";
  if (safeScore >= 70) className = "risk-fill meter-high";
  else if (safeScore >= 40) className = "risk-fill meter-medium";

  return (
    <div>
      <div className="row-between wrap">
        <p className="small strong" style={{ margin: 0 }}>
          Hybrid threat score
        </p>
        <p className="small" style={{ margin: 0 }}>
          Built from ML + rule checks
        </p>
      </div>
      <div className="risk-meter">
        <div className={className} style={{ width: `${safeScore}%` }} />
      </div>
      <p className="small">Overall score: {safeScore}/100</p>

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
