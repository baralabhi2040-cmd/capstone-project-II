import { useState } from "react";
import { scanSms } from "../api/api";
import Loader from "../components/Loader";
import ScanResultCard from "../components/ScanResultCard";
import { isNonEmptyText } from "../utils/validators";

const presets = [
  {
    label: "Prize scam demo",
    sender: "212",
    message: "Congratulations you have won 10 M you don't have to work anymore"
  },
  {
    label: "Parcel lure",
    sender: "2211",
    message: "Urgent! Your parcel is held. Click http://bit.ly/test to reschedule delivery now."
  },
  {
    label: "Clean appointment reminder",
    sender: "City Clinic",
    message: "Reminder: your dental appointment is tomorrow at 9:30 AM. Reply YES to confirm or call reception if you need to reschedule."
  }
];

function SmsScanner() {
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const runScan = async (targetSender, targetMessage) => {
    setError("");
    setResult(null);

    if (!isNonEmptyText(targetMessage)) {
      setError("Please enter the SMS content.");
      return;
    }

    try {
      setLoading(true);
      const data = await scanSms({ sender: targetSender, message: targetMessage });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to scan SMS.");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    runScan(sender, message);
  };

  const handlePhishingExample = () => {
    const example = presets[1];
    setSender(example.sender);
    setMessage(example.message);
    runScan(example.sender, example.message);
  };

  return (
    <div className="page-stack">
      <div id="sms-guide-intro" className="card scanner-intro">
        <div className="scanner-intro-copy">
          <p className="hero-kicker">Message triage lane</p>
          <h3 className="hero-title">Inspect SMS scams with faster presets and sharper visual feedback</h3>
          <p className="hero-description">
            Use quick demos for reward bait, parcel lures, or clean reminders, then compare how the hybrid detector responds.
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
                setMessage(preset.message);
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
              <h3 style={{ margin: 0 }}>SMS probe</h3>
              <p className="small" style={{ margin: "6px 0 0" }}>
                The engine watches for short-code abuse, prize language, urgency, and suspicious links.
              </p>
            </div>
            <span className="badge badge-neutral">Sender + message analysis</span>
          </div>

          <div>
            <label className="label">Phone / Sender</label>
            <input
              id="sms-sender-input"
              className="input"
              type="text"
              placeholder="+61 400 000 000"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
            />
          </div>

          <div>
            <label className="label">SMS Content</label>
            <textarea
              id="sms-message-input"
              className="textarea"
              placeholder="Paste the SMS content here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="helper-row">
            <p className="small">Reward promises, short codes, and suspicious delivery language usually push the score up quickly.</p>
            <p className="small">{message.length} characters</p>
          </div>

          <div className="row wrap">
            <button
              className="button button-secondary"
              type="button"
              onClick={handlePhishingExample}
            >
              Try Phishing Example
            </button>
            <button id="sms-scan-button" className="button button-primary" type="submit">
              Scan SMS
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                setSender("");
                setMessage("");
                setResult(null);
                setError("");
              }}
            >
              Clear
            </button>
          </div>

          {error ? <div className="error-text">{error}</div> : null}
        </form>

        {loading ? (
          <Loader text="Scanning SMS..." />
        ) : (
          <ScanResultCard
            result={result}
            inputSummary={{
              type: "SMS",
              sender: sender || "No sender provided.",
              value: message || "No SMS submitted yet.",
            }}
          />
        )}
      </div>
    </div>
  );
}

export default SmsScanner;
