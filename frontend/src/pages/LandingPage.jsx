import { Link } from "react-router-dom";
import "./LandingPage.css";

const project = {
  title: "PhishGuard",
  subtitle: "AI-Based Multi-Channel Phishing Detection System",
  description:
    "PhishGuard is a cybersecurity project designed to detect phishing attempts across URLs, emails, SMS, and social media using machine learning, rule-based detection, threat scoring, guided explanations, and an interactive dashboard.",
  features: [
    "Multi-channel phishing detection",
    "Threat score and risk-level output",
    "Interactive dashboard and analytics",
    "Guided live demo walkthrough",
    "FastAPI backend with React frontend",
  ],
  tech: ["React + Vite", "FastAPI", "Python", "Scikit-learn", "Pandas", "SQLite"],
  accent: "cyan",
};

const platformFeatures = [
  "Explainable risk scoring",
  "Machine learning workflows",
  "Security analytics",
  "Dashboard reporting",
  "Guided demo mode",
  "Production-style architecture",
];

const previewAssets = [
  {
    title: "Dashboard",
    image: "/assets/dashboard/dashboard-preview.png",
    caption: "Command-center analytics for scan volume, risk split, and channel activity.",
  },
  {
    title: "URL Scanner",
    image: "/assets/scanners/url-scan.png",
    caption: "Hybrid scoring for suspicious links, domains, and phishing keywords.",
  },
  {
    title: "Email Scanner",
    image: "/assets/scanners/email-scan.png",
    caption: "Sender and content checks for impersonation, urgency, and credential lures.",
  },
  {
    title: "SMS Scanner",
    image: "/assets/scanners/sms-scan.png",
    caption: "Smishing detection for reward bait, short-code abuse, and urgent links.",
  },
];

function ProjectCard({ project }) {
  return (
    <article className={`landing-project-card accent-${project.accent}`}>
      <div className="project-card-topline">
        <span className="landing-chip">Capstone Project</span>
        <span className="project-signal" aria-hidden="true" />
      </div>

      <h3>{project.title}</h3>
      <p className="project-subtitle">{project.subtitle}</p>
      <p className="project-description">{project.description}</p>

      <div className="project-section">
        <p className="section-label">Core Features</p>
        <ul className="landing-feature-list">
          {project.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>

      <div className="project-section">
        <p className="section-label">Technology Stack</p>
        <div className="landing-tag-row">
          {project.tech.map((item) => (
            <span key={item} className="landing-tag">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="landing-button-row">
        <Link to="/app" className="landing-button landing-button-primary">
          Live Demo
        </Link>
        {/* Replace # with the repository URL. */}
        <a href="#" className="landing-button landing-button-secondary">
          GitHub
        </a>
        <Link to="/app/poster" className="landing-button landing-button-ghost">
          Poster / PDF
        </Link>
      </div>
    </article>
  );
}

function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <nav className="landing-nav" aria-label="Project showcase navigation">
          <div className="landing-brand">
            <span className="landing-brand-mark">PG</span>
            <span>
              <strong>Cybersecurity Capstone</strong>
              <small>Phishing detection showcase</small>
            </span>
          </div>
          <div className="landing-nav-actions">
            <a href="#projects">Projects</a>
            <a href="#team">Team</a>
            <Link to="/app/poster">Poster</Link>
            <Link to="/app" className="landing-nav-button">
              Open Dashboard
            </Link>
          </div>
        </nav>

        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="landing-kicker">QR Visitor Landing Page</p>
            <h1>AI-powered phishing detection built for live analysis, scoring, and response.</h1>
            <p className="landing-hero-text">
              Explore PhishGuard as a focused capstone platform for detecting phishing across links, emails, SMS, and social messages with explainable outputs and a guided presentation workflow.
            </p>
            <div className="landing-hero-actions">
              <a href="#projects" className="landing-button landing-button-primary">
                View Projects
              </a>
              <Link to="/app" className="landing-button landing-button-secondary">
                Launch PhishGuard
              </Link>
            </div>
          </div>

          <div className="landing-command-panel" aria-label="Cybersecurity dashboard preview">
            <div className="command-header">
              <span />
              <span />
              <span />
              <strong>threat-console</strong>
            </div>
            <div className="command-metrics">
              <div>
                <small>Channels</small>
                <strong>4</strong>
              </div>
              <div>
                <small>Risk Output</small>
                <strong>0-100</strong>
              </div>
              <div>
                <small>Mode</small>
                <strong>Hybrid</strong>
              </div>
            </div>
            <div className="command-feed">
              <p><span className="feed-dot safe" /> URL scan classified with low risk</p>
              <p><span className="feed-dot warn" /> SMS lure escalated for review</p>
              <p><span className="feed-dot danger" /> Suspicious login prompt flagged</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="projects">
        <div className="landing-section-heading">
          <p className="landing-kicker">Project Showcase</p>
          <h2>One focused phishing detection system, ready for exhibition.</h2>
          <p>
            The showcase is designed for QR-code visitors who need a quick, professional overview before opening the live dashboard, guided demo, or project poster.
          </p>
        </div>

        <div className="landing-project-grid">
          <ProjectCard project={project} />
        </div>
      </section>

      <section className="landing-section landing-feature-band">
        <div>
          <p className="landing-kicker">Capabilities</p>
          <h2>Built around explainable cybersecurity workflows.</h2>
        </div>
        <div className="landing-feature-tags">
          {platformFeatures.map((feature) => (
            <span key={feature}>{feature}</span>
          ))}
        </div>
      </section>

      <section className="landing-section landing-screenshot-section">
        <div className="landing-section-heading">
          <p className="landing-kicker">System Preview</p>
          <h2>Real PhishGuard screenshots for exhibition visuals.</h2>
          <p>
            These previews come directly from the project public assets, so QR visitors can understand the dashboard and scanner workflows before entering the live app.
          </p>
        </div>
        <div className="landing-screenshot-showcase">
          <div className="landing-screenshot-main">
            <div className="preview-window-topbar">
              <span />
              <span />
              <span />
              <strong>phishguard-dashboard.png</strong>
            </div>
            <img
              src="/assets/dashboard/dashboard-preview.png?v=landing-preview-20260419"
              alt="PhishGuard dashboard preview"
            />
          </div>

          <div className="landing-preview-grid">
            {previewAssets.slice(1).map((asset) => (
              <div className="landing-preview-card" key={asset.title}>
                <img
                  src={`${asset.image}?v=landing-preview-20260419`}
                  alt={`${asset.title} preview`}
                  loading="lazy"
                />
                <div>
                  <strong>{asset.title}</strong>
                  <p>{asset.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="landing-preview-actions">
          <Link to="/app/showcase" className="landing-button landing-button-primary">
            Open Full Showcase
          </Link>
          <Link to="/app" className="landing-button landing-button-secondary">
            Launch Live Dashboard
          </Link>
        </div>
      </section>

      <section className="landing-section landing-team-section" id="team">
        <div>
          <p className="landing-kicker">Team</p>
          <h2>Project contributors and supervision.</h2>
        </div>
        <div className="landing-team-grid">
          {["Abhishek Baral", "Paban Oli", "Rohit Shrestha"].map((member) => (
            <div className="landing-team-card" key={member}>
              <span>Team Member</span>
              <strong>{member}</strong>
            </div>
          ))}
          <div className="landing-team-card supervisor">
            <span>Supervisor</span>
            <strong>Dr Md Arafat Mahmud</strong>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
