import { useEffect, useState } from "react";
import { API_BASE_URL, getHealth } from "../api/api";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";

function Settings() {
  const { user, isVerified, resendVerification, loading } = useAuth();
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getHealth();
        setHealth(data);
      } catch (err) {
        setError(err?.response?.data?.detail || "Failed to load settings.");
      }
    };

    load();
  }, []);

  const handleResend = async () => {
    setBusy(true);
    setNotice("");
    try {
      const response = await resendVerification();
      setNotice(
        response.delivery_mode === "preview"
          ? "Verification email prepared in local preview mode."
          : response.message
      );
    } catch (requestError) {
      setNotice(
        requestError?.response?.data?.detail ||
          "Could not resend verification right now."
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader text="Loading settings..." />;
  if (error) return <div className="card error-text">{error}</div>;
  if (!health) return <Loader text="Loading settings..." />;

  return (
    <div className="page-stack">
      <div className="card">
        <h3>Account</h3>
        {user ? (
          <div className="kv-grid">
            <div className="muted">Full name</div>
            <div>{user.full_name}</div>

            <div className="muted">Email</div>
            <div>{user.email}</div>

            <div className="muted">Verification</div>
            <div>
              <span className={`badge ${isVerified ? "badge-success" : "badge-warning"}`}>
                {isVerified ? "Verified" : "Pending"}
              </span>
            </div>

            <div className="muted">Snapshot delivery</div>
            <div>
              {isVerified
                ? "Enabled for your account"
                : "Locked until email verification is complete"}
            </div>
          </div>
        ) : (
          <p className="muted">
            You are currently using guest mode. Create an account to keep personal logs and send scan snapshots to your mailbox.
          </p>
        )}

        {user && !isVerified ? (
          <div className="row wrap" style={{ marginTop: 18 }}>
            <button
              type="button"
              className="button button-primary"
              disabled={busy}
              onClick={handleResend}
            >
              {busy ? "Sending..." : "Resend verification email"}
            </button>
            {notice ? <span className="badge badge-neutral">{notice}</span> : null}
          </div>
        ) : null}
      </div>

      <div className="card">
        <h3>System Health</h3>
        <div className="kv-grid">
          <div className="muted">API Status</div>
          <div>{health.status}</div>

          <div className="muted">Database</div>
          <div>{health.database}</div>

          <div className="muted">Version</div>
          <div>{health.version}</div>

          <div className="muted">Rules Engine</div>
          <div>{health.rules_engine}</div>

          <div className="muted">Auth</div>
          <div>{health.auth}</div>

          <div className="muted">Email Delivery</div>
          <div>{health.email_delivery}</div>
        </div>
      </div>

      <div className="card">
        <h3>Frontend Configuration</h3>
        <div className="kv-grid">
          <div className="muted">API Base URL</div>
          <div>{API_BASE_URL || "Same origin"}</div>

          <div className="muted">Environment</div>
          <div>{import.meta.env.DEV ? "Development" : "Production"}</div>
        </div>
      </div>

      <div className="card">
        <h3>Notes</h3>
        <p className="muted">
          Snapshot emails use SMTP when configured. If no mail server is configured yet, PhishGuard falls back to a local outbox preview so you can still test the full account flow during development.
        </p>
      </div>
    </div>
  );
}

export default Settings;
