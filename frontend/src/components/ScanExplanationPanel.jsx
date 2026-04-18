const channelSignals = {
  url: [
    "HTTPS and link structure",
    "Domain, TLD, and subdomain patterns",
    "Credential or account-related wording",
    "ML phishing likelihood when available",
  ],
  email: [
    "Sender identity and impersonation clues",
    "Subject urgency and pressure language",
    "Body links, attachments, and credential requests",
    "ML phishing likelihood when available",
  ],
  sms: [
    "Sender trust and short-code patterns",
    "Urgency, reward, and delivery-scam language",
    "Shortened or suspicious links",
    "ML phishing likelihood when available",
  ],
  social: [
    "Platform context",
    "Giveaway, support, or investment-scam language",
    "Account-access and impersonation cues",
    "ML phishing likelihood when available",
  ],
};

function buildInputLines(inputSummary) {
  if (!inputSummary) return ["Input is available in the scanner form."];

  const lines = [];
  if (inputSummary.type) lines.push(`Type: ${inputSummary.type}`);
  if (inputSummary.sender) lines.push(`Sender: ${inputSummary.sender}`);
  if (inputSummary.subject) lines.push(`Subject: ${inputSummary.subject}`);
  if (inputSummary.platform) lines.push(`Platform: ${inputSummary.platform}`);
  if (inputSummary.value) lines.push(`Content: ${inputSummary.value}`);
  return lines.length ? lines : ["Input is available in the scanner form."];
}

function verdictCopy(result) {
  const label = result.label === "phishing" ? "Phishing likely" : "Looks legitimate";
  return `${label}: ${result.risk_level} risk with a ${result.threat_score}/100 threat score and ${Math.round((result.confidence || 0) * 100)}% confidence.`;
}

function ScanExplanationPanel({ result, inputSummary }) {
  if (!result) return null;

  const channel = (result.channel || "url").toLowerCase();
  const inspectedSignals = channelSignals[channel] || channelSignals.url;
  const indicators = result.indicators || [];
  const riskFactors = result.risk_factors || [];
  const explanation = result.explanation || result.summary;
  const recommendedActions = result.recommended_actions?.length
    ? result.recommended_actions
    : [result.recommendation].filter(Boolean);
  const topIndicators = indicators
    .filter((indicator) => indicator.impact > 0 || indicator.source === "ml")
    .slice(0, 4);

  return (
    <section id="scan-explanation-panel" className="scan-explanation-panel">
      <div className="scan-explanation-header">
        <div>
          <p className="hero-kicker">Guided detection explanation</p>
          <h3>How PhishGuard reached this verdict</h3>
        </div>
        <span
          className={`badge ${
            result.label === "phishing" ? "badge-danger" : "badge-success"
          }`}
        >
          {result.label}
        </span>
      </div>

      <div className="explanation-timeline">
        <div className="explanation-step">
          <span className="explanation-step-index">1</span>
          <div>
            <h4>Input received</h4>
            {buildInputLines(inputSummary).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="explanation-step">
          <span className="explanation-step-index">2</span>
          <div>
            <h4>Signals inspected</h4>
            <ul>
              {inspectedSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="explanation-step">
          <span className="explanation-step-index">3</span>
          <div>
            <h4>Risk indicators found</h4>
            {topIndicators.length ? (
              <ul>
                {topIndicators.map((indicator, index) => (
                  <li key={`${indicator.title}-${index}`}>
                    {indicator.title}: {indicator.detail}
                  </li>
                ))}
              </ul>
            ) : riskFactors.length ? (
              <ul>
                {riskFactors.slice(0, 4).map((factor) => (
                  <li key={factor}>{factor}</li>
                ))}
              </ul>
            ) : (
              <p>No strong phishing indicators were found in this scan.</p>
            )}
          </div>
        </div>

        <div className="explanation-step">
          <span className="explanation-step-index">4</span>
          <div>
            <h4>Why this matters</h4>
            <p>{explanation}</p>
          </div>
        </div>

        <div className="explanation-step">
          <span className="explanation-step-index">5</span>
          <div>
            <h4>Recommended user action</h4>
            {recommendedActions.length > 1 ? (
              <ul>
                {recommendedActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            ) : (
              <p>{result.recommendation}</p>
            )}
          </div>
        </div>

        <div className="explanation-step final">
          <span className="explanation-step-index">6</span>
          <div>
            <h4>Final verdict</h4>
            <p>{verdictCopy(result)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ScanExplanationPanel;
