import { useEffect, useMemo, useState } from "react";
import { getLogs } from "../api/api";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/formatDate";
import { getRiskBadgeClass } from "../utils/riskLevel";

function Logs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [scanType, setScanType] = useState("all");

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setError("");
        setLoading(true);
        const data = await getLogs(200);
        setLogs(data);
      } catch (err) {
        setError(err?.response?.data?.detail || "Failed to load logs.");
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [user]);

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const matchesType = scanType === "all" || item.scan_type === scanType;
      const haystack =
        `${item.input_text} ${item.label} ${item.platform || ""}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [logs, scanType, search]);

  if (loading) return <Loader text="Loading logs..." />;
  if (error) return <div className="card error-text">{error}</div>;

  return (
    <div className="page-stack">
      <div className="card">
        <div className="row wrap">
          <input
            className="input"
            style={{ maxWidth: 320 }}
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select"
            style={{ maxWidth: 220 }}
            value={scanType}
            onChange={(e) => setScanType(e.target.value)}
          >
            <option value="all">All Channels</option>
            <option value="url">URL</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="social">Social</option>
          </select>
        </div>
        <p className="small" style={{ marginTop: 14 }}>
          {user
            ? "Showing your private scan history."
            : "Showing guest-mode scans. Create an account to keep personal logs and email snapshots to yourself."}
        </p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Platform</th>
              <th>Label</th>
              <th>Risk</th>
              <th>Threat Score</th>
              <th>Snapshot</th>
              <th>Input</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="8">No logs found.</td>
              </tr>
            ) : (
              filteredLogs.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.created_at)}</td>
                  <td>{item.scan_type}</td>
                  <td>{item.platform || "-"}</td>
                  <td>
                    <span
                      className={`badge ${
                        item.label === "phishing"
                          ? "badge-danger"
                          : "badge-success"
                      }`}
                    >
                      {item.label}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getRiskBadgeClass(item.risk_level)}`}>
                      {item.risk_level}
                    </span>
                  </td>
                  <td>{item.threat_score}</td>
                  <td>{item.snapshot_sent_at ? formatDate(item.snapshot_sent_at) : "-"}</td>
                  <td style={{ maxWidth: 300, whiteSpace: "pre-wrap" }}>
                    {item.input_text}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Logs;
