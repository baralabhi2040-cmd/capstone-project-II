import { useState } from "react";
import { scanSocial } from "../api/api";
import Loader from "../components/Loader";
import ScanResultCard from "../components/ScanResultCard";
import { isNonEmptyText } from "../utils/validators";

const presets = [
  {
    label: "Fake prize DM",
    platform: "instagram",
    message: "You won a prize. Verify your account now using https://fake-site.com"
  },
  {
    label: "Crypto lure",
    platform: "telegram",
    message: "Official support here. Send money now and we will double your crypto within one hour."
  },
  {
    label: "Clean networking message",
    platform: "linkedin",
    message: "Thanks for connecting. I enjoyed your talk yesterday and would love to continue the conversation about internship opportunities."
  }
];

function SocialScanner() {
  const [platform, setPlatform] = useState("instagram");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const runScan = async (targetPlatform, targetMessage) => {
    setError("");
    setResult(null);

    if (!isNonEmptyText(targetMessage)) {
      setError("Please enter the social media message.");
      return;
    }

    try {
      setLoading(true);
      const data = await scanSocial({
        platform: targetPlatform,
        message: targetMessage,
      });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to scan social message.");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    runScan(platform, message);
  };

  const handlePhishingExample = () => {
    const example = presets[0];
    setPlatform(example.platform);
    setMessage(example.message);
    runScan(example.platform, example.message);
  };

  return (
    <div className="page-stack">
      <div id="social-guide-intro" className="card scanner-intro">
        <div className="scanner-intro-copy">
          <p className="hero-kicker">Conversation watch</p>
          <h3 className="hero-title">Stress-test suspicious DMs and support impersonation scenarios</h3>
          <p className="hero-description">
            Move between platforms quickly, load guided examples, and inspect how giveaway bait or crypto lures shift the hybrid score.
          </p>
        </div>
        <div className="scanner-preset-bar">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="button button-chip"
              onClick={() => {
                setPlatform(preset.platform);
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
              <h3 style={{ margin: 0 }}>Social message probe</h3>
              <p className="small" style={{ margin: "6px 0 0" }}>
                Great for testing fake support accounts, giveaway bait, crypto scams, and account-reset prompts.
              </p>
            </div>
            <span className="badge badge-neutral">Platform-aware scoring</span>
          </div>

          <div>
            <label className="label">Platform</label>
            <select
              id="social-platform-select"
              className="select"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook Messenger</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="x">X / Twitter</option>
              <option value="snapchat">Snapchat</option>
            </select>
          </div>

          <div>
            <label className="label">Message</label>
            <textarea
              id="social-message-input"
              className="textarea"
              placeholder="Paste the message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="helper-row">
            <p className="small">Official-support claims, crypto offers, and reward lures are the biggest social red flags.</p>
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
            <button id="social-scan-button" className="button button-primary" type="submit">
              Scan Social Message
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                setPlatform("instagram");
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
          <Loader text="Scanning social message..." />
        ) : (
          <ScanResultCard
            result={result}
            inputSummary={{
              type: "Social",
              platform,
              value: message || "No social message submitted yet.",
            }}
          />
        )}
      </div>
    </div>
  );
}

export default SocialScanner;
