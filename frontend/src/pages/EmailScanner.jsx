import { useState } from "react";
import { scanEmail } from "../api/api";
import Loader from "../components/Loader";
import ScanResultCard from "../components/ScanResultCard";
import { isNonEmptyText } from "../utils/validators";

const presets = [
  {
    label: "Suspicious verification mail",
    sender: "support-paypal@gmail.com",
    subject: "Urgent: verify your account",
    body: "We detected unusual activity. Click here to verify your account immediately and reset your password."
  },
  {
    label: "Clean internal update",
    sender: "hr@company.com",
    subject: "Team meeting tomorrow",
    body: "Please join the product sync at 10 AM tomorrow in board room 2. Agenda and notes will be shared after the meeting."
  },
  {
    label: "Invoice scam demo",
    sender: "billing@invoice-securecopy.com",
    subject: "Final notice: unpaid invoice 441921",
    body: "Your payment is overdue. Open the attached invoice_copy.docm and complete the transfer today to avoid account suspension."
  }
];

function EmailScanner() {
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!isNonEmptyText(body)) {
      setError("Please enter the email body.");
      return;
    }

    try {
      setLoading(true);
      const data = await scanEmail({ sender, subject, body });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to scan email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="card scanner-intro">
        <div className="scanner-intro-copy">
          <p className="hero-kicker">Inbox evidence lab</p>
          <h3 className="hero-title">Stage sender, subject, and body content in a richer email triage workflow</h3>
          <p className="hero-description">
            Load guided demos, compare safe versus risky patterns, and see exactly why an email crosses the phishing threshold.
          </p>
        </div>
        <div className="scanner-preset-bar">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="button button-chip"
              onClick={() => {
                setSender(preset.sender);
                setSubject(preset.subject);
                setBody(preset.body);
                setResult(null);
                setError("");
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2 scanner-layout">
        <form className="card form-grid scanner-form-card" onSubmit={handleScan}>
          <div className="form-header">
            <div>
              <h3 style={{ margin: 0 }}>Email triage form</h3>
              <p className="small" style={{ margin: "6px 0 0" }}>
                Sender impersonation, pressure language, unsafe attachments, and credential prompts all influence the verdict.
              </p>
            </div>
            <span className="badge badge-neutral">Header + body analysis</span>
          </div>

          <div>
            <label className="label">Sender</label>
            <input
              className="input"
              type="text"
              placeholder="security@bank-alerts.com"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Subject</label>
            <input
              className="input"
              type="text"
              placeholder="Urgent: Verify your account now"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Email Body</label>
            <textarea
              className="textarea"
              placeholder="Paste the email content here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="helper-row">
            <p className="small">Impersonation, urgency, and credential requests are among the strongest email indicators.</p>
            <p className="small">{body.length} characters</p>
          </div>

          <div className="row wrap">
            <button className="button button-primary" type="submit">
              Scan Email
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                setSender("");
                setSubject("");
                setBody("");
                setResult(null);
                setError("");
              }}
            >
              Clear
            </button>
          </div>

          {error ? <div className="error-text">{error}</div> : null}
        </form>

        {loading ? <Loader text="Scanning email..." /> : <ScanResultCard result={result} />}
      </div>
    </div>
  );
}

export default EmailScanner;
