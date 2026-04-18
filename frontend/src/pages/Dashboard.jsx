import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { getStats } from "../api/api";
import Loader from "../components/Loader";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";

const fallbackStats = {
  total_scans: 0,
  phishing_count: 0,
  legitimate_count: 0,
  channel_counts: {},
  risk_distribution: {},
  most_targeted_channel: "-",
  average_threat_score: 0,
  daily_activity: [],
  scope: "offline",
  verification_required_for_snapshots: true,
};

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setError("");
        setLoading(true);
        const data = await getStats();
        setStats(data);
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            "Dashboard is using an offline fallback because live stats could not be reached."
        );
        setStats((currentStats) => currentStats || fallbackStats);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  if (loading && !stats) return <Loader text="Loading dashboard..." />;

  const activeStats = stats || fallbackStats;

  const channelData = Object.entries(activeStats.channel_counts || {}).map(
    ([name, value]) => ({
      name: name.toUpperCase(),
      value
    })
  );

  const riskData = Object.entries(activeStats.risk_distribution || {}).map(
    ([name, value]) => ({
      name,
      value,
      fill:
        {
          low: "#31d08b",
          medium: "#ffb24c",
          high: "#ff6578",
          critical: "#9a7dff",
        }[name.toLowerCase()] || "#41dbff"
    })
  );

  const phishingRate = activeStats.total_scans
    ? Math.round((activeStats.phishing_count / activeStats.total_scans) * 100)
    : 0;
  const activeChannels = channelData.filter((item) => item.value > 0).length;
  const latestActivity = (activeStats.daily_activity || []).at(-1);
  const latestVolume = latestActivity
    ? (latestActivity.phishing || 0) + (latestActivity.legitimate || 0)
    : 0;

  return (
    <div className="page-stack">
      {error ? (
        <div className="card error-text">
          {error}
        </div>
      ) : null}

      <div id="dashboard-hero" className="card dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="hero-kicker">Threat command center</p>
          <h3 className="hero-title">
            Turn raw phishing scans into an operator-ready response picture
          </h3>
          <p className="hero-description">
            PhishGuard now feels like a real monitoring cockpit: hybrid scoring,
            channel analytics, and richer result storytelling all in one surface.
          </p>
          <div className="row wrap">
            <span className="badge badge-danger">{phishingRate}% phishing rate</span>
            <span className="badge badge-neutral">
              {activeChannels}/4 channels active
            </span>
            <span className="badge badge-warning">
              {latestVolume} scans in latest activity window
            </span>
            <span className="badge badge-neutral">
              {activeStats.scope === "personal"
                ? "Personal workspace"
                : activeStats.scope === "offline"
                  ? "Offline fallback"
                  : "Guest workspace"}
            </span>
          </div>
        </div>

        <div className="hero-panel-grid">
          <div className="hero-metric">
            <p className="small">Latest activity day</p>
            <h4>{latestActivity?.day || "No data"}</h4>
            <p className="small">Freshest recorded backend scan activity</p>
          </div>
          <div className="hero-metric">
            <p className="small">Most targeted lane</p>
            <h4>{(activeStats.most_targeted_channel || "-").toUpperCase()}</h4>
            <p className="small">The busiest phishing surface in your log history</p>
          </div>
        </div>
      </div>

      <div className="card-grid">
        <StatCard
          id="dashboard-total-scans"
          title="Total Scans"
          value={activeStats.total_scans}
          subtitle="All scans captured across the monitoring workspace."
          tone="cyan"
        />
        <StatCard
          id="dashboard-phishing-count"
          title="Phishing Detected"
          value={activeStats.phishing_count}
          subtitle="Cases that crossed the phishing decision threshold."
          tone="danger"
        />
        <StatCard
          id="dashboard-legitimate-count"
          title="Legitimate"
          value={activeStats.legitimate_count}
          subtitle="Messages and links that passed the current checks."
          tone="success"
        />
        <StatCard
          id="dashboard-top-channel"
          title="Most Targeted Channel"
          value={(activeStats.most_targeted_channel || "-").toUpperCase()}
          subtitle="The channel drawing the most scan attention right now."
          tone="amber"
        />
      </div>

      <div className="grid-2">
        <div id="dashboard-channel-distribution" className="card">
          <div className="chart-card-header">
            <div>
              <p className="small">Coverage map</p>
              <h3>Channel Distribution</h3>
            </div>
            <span className="badge badge-neutral">Live from scan logs</span>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(93,132,181,0.1)" />
                <XAxis dataKey="name" stroke="#8ea4c7" />
                <YAxis stroke="#8ea4c7" />
                <Tooltip />
                <Bar dataKey="value" fill="#41dbff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div id="dashboard-risk-distribution" className="card">
          <div className="chart-card-header">
            <div>
              <p className="small">Severity mix</p>
              <h3>Risk Level Distribution</h3>
            </div>
            <span className="badge badge-warning">Threat posture</span>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={riskData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {riskData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={entry.fill}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div id="dashboard-daily-activity" className="card">
        <div className="chart-card-header">
          <div>
            <p className="small">Momentum</p>
            <h3>Latest 7-Day Activity</h3>
          </div>
          <span className="badge badge-success">Rolling 7-day view</span>
        </div>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={activeStats.daily_activity || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(93,132,181,0.1)" />
              <XAxis dataKey="day" stroke="#8ea4c7" />
              <YAxis stroke="#8ea4c7" />
              <Tooltip />
              <Bar dataKey="phishing" fill="#ff6578" radius={[8, 8, 0, 0]} />
              <Bar dataKey="legitimate" fill="#31d08b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
