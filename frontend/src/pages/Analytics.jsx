import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { getStats } from "../api/api";
import Loader from "../components/Loader";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";

function Analytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        setStats(null);
        const data = await getStats();
        setStats(data);
      } catch (err) {
        setError(err?.response?.data?.detail || "Failed to load analytics.");
      }
    };

    load();
  }, [user]);

  if (error) return <div className="card error-text">{error}</div>;
  if (!stats) return <Loader text="Loading analytics..." />;

  const channelData = Object.entries(stats.channel_counts || {}).map(
    ([name, value]) => ({
      channel: name.toUpperCase(),
      scans: value
    })
  );

  const riskData = Object.entries(stats.risk_distribution || {}).map(
    ([name, value]) => ({
      risk: name,
      count: value,
      fill:
        {
          low: "#31d08b",
          medium: "#ffb24c",
          high: "#ff6578",
          critical: "#9a7dff",
        }[name.toLowerCase()] || "#41dbff"
    })
  );
  const phishingRate = stats.total_scans
    ? Math.round((stats.phishing_count / stats.total_scans) * 100)
    : 0;

  return (
    <div className="page-stack">
      <div className="card dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="hero-kicker">Signal intelligence</p>
          <h3 className="hero-title">Read the shape of the threat, not just the total volume</h3>
          <p className="hero-description">
            Use channel concentration, severity distribution, and recent activity to decide where your
            monitoring needs stronger rules or more operator attention.
          </p>
        </div>
        <div className="hero-panel-grid">
          <div className="hero-metric">
            <p className="small">Average threat score</p>
            <h4>{stats.average_threat_score}</h4>
            <p className="small">Mean hybrid score across the entire log history</p>
          </div>
          <div className="hero-metric">
            <p className="small">Analytics scope</p>
            <h4>{stats.scope === "personal" ? "Personal" : "Guest"}</h4>
            <p className="small">The current identity context used for this dashboard</p>
          </div>
        </div>
      </div>

      <div className="card-grid">
        <StatCard
          title="Average Threat Score"
          value={stats.average_threat_score}
          subtitle="Overall hybrid risk average."
          tone="cyan"
        />
        <StatCard
          title="Phishing Rate"
          value={`${phishingRate}%`}
          subtitle="How often scans end in a phishing verdict."
          tone="danger"
        />
        <StatCard
          title="Most Targeted Channel"
          value={(stats.most_targeted_channel || "-").toUpperCase()}
          subtitle="The busiest channel in historical scans."
          tone="amber"
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="chart-card-header">
            <div>
              <p className="small">Surface load</p>
              <h3>Scans by Channel</h3>
            </div>
            <span className="badge badge-neutral">Volume split</span>
          </div>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(93,132,181,0.1)" />
                <XAxis dataKey="channel" stroke="#8ea4c7" />
                <YAxis stroke="#8ea4c7" />
                <Tooltip />
                <Legend />
                <Bar dataKey="scans" fill="#41dbff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="chart-card-header">
            <div>
              <p className="small">Risk stack</p>
              <h3>Risk Level Overview</h3>
            </div>
            <span className="badge badge-warning">Severity view</span>
          </div>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(93,132,181,0.1)" />
                <XAxis dataKey="risk" stroke="#8ea4c7" />
                <YAxis stroke="#8ea4c7" />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {riskData.map((entry) => (
                    <Cell key={entry.risk} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="chart-card-header">
          <div>
            <p className="small">Activity waveform</p>
            <h3>7-Day Detection Activity</h3>
          </div>
          <span className="badge badge-success">Trend monitor</span>
        </div>
        <div style={{ width: "100%", height: 340 }}>
          <ResponsiveContainer>
            <BarChart data={stats.daily_activity || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(93,132,181,0.1)" />
              <XAxis dataKey="day" stroke="#8ea4c7" />
              <YAxis stroke="#8ea4c7" />
              <Tooltip />
              <Legend />
              <Bar dataKey="phishing" fill="#ff6578" radius={[8, 8, 0, 0]} />
              <Bar dataKey="legitimate" fill="#31d08b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
