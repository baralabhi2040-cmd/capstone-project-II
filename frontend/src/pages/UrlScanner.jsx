import { useState } from "react";
import { scanUrl } from "../api/api";
import Loader from "../components/Loader";
import ScanResultCard from "../components/ScanResultCard";
import { isValidUrl } from "../utils/validators";

const presets = [
  {
    label: "Suspicious login lure",
    value: "http://secure-paypal-login.verify-account.ru/signin"
  },
  {
    label: "Safe reference site",
    value: "https://www.google.com"
  },
  {
    label: "Long deceptive URL",
    value: "http://account-security-check.example-login-confirm.net/update-details"
  }
];

function UrlScanner() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    try {
      setLoading(true);
      const data = await scanUrl({ url });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to scan URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="card scanner-intro">
        <div className="scanner-intro-copy">
          <p className="hero-kicker">Link intercept studio</p>
          <h3 className="hero-title">Throw suspicious URLs into a faster visual triage loop</h3>
          <p className="hero-description">
            Test real links, compare clean versus malicious examples, and watch the hybrid detector explain what it sees.
          </p>
        </div>
        <div className="scanner-preset-bar">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="button button-chip"
              onClick={() => {
                setUrl(preset.value);
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
              <h3 style={{ margin: 0 }}>URL probe</h3>
              <p className="small" style={{ margin: "6px 0 0" }}>
                Inspect HTTPS usage, suspicious keywords, deceptive structure, and model confidence.
              </p>
            </div>
            <span className="badge badge-neutral">Single-link analysis</span>
          </div>

          <div>
            <label className="label">Enter URL</label>
            <input
              className="input"
              type="text"
              placeholder="https://example.com/login"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="helper-row">
            <p className="small">Long domains, odd TLDs, and credential words are strong phishing clues.</p>
            <p className="small">{url.length} characters</p>
          </div>

          <div className="row wrap">
            <button className="button button-primary" type="submit">
              Scan URL
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                setUrl("");
                setResult(null);
                setError("");
              }}
            >
              Clear
            </button>
          </div>

          {error ? <div className="error-text">{error}</div> : null}
        </form>

        {loading ? <Loader text="Scanning URL..." /> : <ScanResultCard result={result} />}
      </div>
    </div>
  );
}

export default UrlScanner;
