import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const groupedLinks = [
  {
    heading: "Mission Control",
    items: [{ to: "/app", label: "Dashboard", code: "OV", icon: "dashboard" }]
  },
  {
    heading: "Scan Lanes",
    items: [
      { to: "/app/scan/url", label: "URL Scanner", code: "URL", icon: "url" },
      { to: "/app/scan/email", label: "Email Scanner", code: "EML", icon: "email" },
      { to: "/app/scan/sms", label: "SMS Scanner", code: "SMS", icon: "sms" },
      { to: "/app/scan/social", label: "Social Scanner", code: "SOC", icon: "social" }
    ]
  },
  {
    heading: "Operations",
    items: [
      { to: "/app/logs", label: "Logs", code: "LOG", icon: "logs" },
      { to: "/app/analytics", label: "Analytics", code: "ANA", icon: "analytics" },
      { to: "/app/poster", label: "Project Poster", code: "PDF", icon: "poster" },
      { to: "/app/settings", label: "Settings", code: "CFG", icon: "settings" },
      { to: "/app/auth", label: "Account", code: "ID", icon: "account" }
    ]
  }
];

function Sidebar() {
  const { user, isVerified } = useAuth();

  return (
    <aside className="sidebar">
      <div className="logo-box">
        <div className="logo-mark">PG</div>
        <div>
          <h1 className="logo-title">PhishGuard</h1>
          <p className="logo-subtitle">Hybrid phishing response cockpit</p>
        </div>
      </div>

      {groupedLinks.map((group) => (
        <div key={group.heading} className="sidebar-section">
          <p className="sidebar-heading">{group.heading}</p>
          <nav className="nav-list">
            {group.items.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/app"}
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                <span className="nav-link-main">
                  <span className={`nav-link-icon nav-icon-${link.icon}`} aria-hidden="true" />
                  <span className="nav-link-copy">{link.label}</span>
                </span>
                <span className="nav-link-code">{link.code}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      ))}

      <div className="sidebar-status">
        <p className="small" style={{ margin: 0 }}>
          {user ? "Account workspace" : "Threat workspace"}
        </p>
        <h3 style={{ margin: "8px 0 10px" }}>
          {user ? `Welcome, ${user.full_name}` : "Ready for live triage"}
        </h3>
        <p className="muted" style={{ margin: 0 }}>
          {user
            ? isVerified
              ? "Your private scan history is active, and email snapshots are unlocked."
              : "Your private scan history is active. Verify your email to unlock snapshot delivery."
            : "Create an account to keep a personal scan history and mail yourself saved snapshots."}
        </p>
        <div className="row wrap sidebar-status-pills">
          <span className="badge badge-success">Operational</span>
          <span className="badge badge-neutral">
            {user ? (isVerified ? "Verified account" : "Verification pending") : "Guest mode"}
          </span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
