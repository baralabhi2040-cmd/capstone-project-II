const sharedRiskTerms = [
  "urgent",
  "verify",
  "click here",
  "immediately",
  "account locked",
  "account suspended",
  "password",
  "login",
  "reset",
  "confirm",
  "prize",
  "winner",
  "won",
  "claim",
  "reward",
  "parcel",
  "delivery",
  "payment",
  "invoice",
  "bank",
  "crypto",
  "official support",
  "limited offer",
];

const channelTerms = {
  url: [
    "http://",
    "@",
    "login",
    "verify",
    "secure",
    "account",
    "update",
    "password",
    ".ru",
    ".tk",
    ".zip",
  ],
  email: sharedRiskTerms,
  sms: sharedRiskTerms,
  social: sharedRiskTerms,
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getContent(inputSummary) {
  if (!inputSummary) return "";
  return [inputSummary.sender, inputSummary.subject, inputSummary.platform, inputSummary.value]
    .filter(Boolean)
    .join("\n");
}

function extractTermsFromFactors(result) {
  const factors = result?.risk_factors || [];
  const joined = factors.join(" ").toLowerCase();
  return sharedRiskTerms.filter((term) => joined.includes(term));
}

function highlightContent(content, terms) {
  if (!content || !terms.length) return content;

  const uniqueTerms = Array.from(new Set(terms.filter(Boolean))).sort(
    (a, b) => b.length - a.length
  );
  const pattern = new RegExp(`(${uniqueTerms.map(escapeRegExp).join("|")})`, "gi");

  return content.split(pattern).map((part, index) => {
    const isMatch = uniqueTerms.some(
      (term) => term.toLowerCase() === part.toLowerCase()
    );

    if (!isMatch) return part;

    return (
      <mark key={`${part}-${index}`} className="risk-highlight">
        {part}
      </mark>
    );
  });
}

function SuspiciousContentHighlighter({ result, inputSummary }) {
  if (!result || !inputSummary) return null;

  const channel = (result.channel || inputSummary.type || "url").toLowerCase();
  const content = getContent(inputSummary);
  if (!content.trim()) return null;

  const terms = [
    ...(channelTerms[channel] || sharedRiskTerms),
    ...extractTermsFromFactors(result),
  ];

  return (
    <section className="suspicious-content-panel">
      <div className="row-between wrap">
        <div>
          <p className="small strong">Suspicious content spotlight</p>
          <p className="small" style={{ marginTop: 4 }}>
            Risky words and link patterns are highlighted so the audience can see
            what PhishGuard inspected.
          </p>
        </div>
        <span className="badge badge-neutral">{channel.toUpperCase()}</span>
      </div>
      <pre className="highlighted-input-preview">
        {highlightContent(content, terms)}
      </pre>
    </section>
  );
}

export default SuspiciousContentHighlighter;
