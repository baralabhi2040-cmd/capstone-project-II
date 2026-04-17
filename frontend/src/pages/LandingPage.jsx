import { Link } from "react-router-dom";
import "./LandingPage.css";

const projects = [
  {
    title: "PhishGuard",
    subtitle: "AI-Based Multi-Channel Phishing Detection System",
    description:
      "PhishGuard is a cybersecurity project designed to detect phishing attempts across URLs, emails, SMS, and social media using machine learning, rule-based detection, threat scoring, and an interactive dashboard.",
    features: [
      "Multi-channel phishing detection",
      "Threat score and risk-level output",
      "Interactive dashboard and analytics",
      "FastAPI backend with React frontend",
    ],
    tech: ["React + Vite", "FastAPI", "Python", "Scikit-learn", "Pandas", "SQLite"],
    accent: "cyan",
  },
  {
    title: "ML-Based Intrusion Detection System",
    subtitle: "Real-Time Alerting for Network Security Monitoring",
    description:
      "This project is a machine learning-based intrusion detection system that classifies network traffic as malicious or benign and generates real-time alerts using benchmark datasets and multiple ML models.",
    features: [
      "Intrusion detection with ML models",
      "Real-time alert generation",
      "Performance comparison of Random Forest, XGBoost, and Isolation Forest",
      "Monitoring-ready workflow and reporting",
    ],
    tech: ["Python", "Scikit-learn", "Joblib", "Pandas", "CICIDS2017", "UNSW-NB15"],
    accent: "red",
  },
];

const platformFeatures = [
  "Explainable risk scoring",
  "Machine learning workflows",
  "Security analytics",
  "Dashboard reporting",
  "Real-time alert thinking",
  "Production-style architecture",
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
        {/* Replace # with the deployed project link. */}
        <a href="#" className="landing-button landing-button-primary">
          Live Demo
        </a>
        {/* Replace # with the repository URL. */}
        <a href="#" className="landing-button landing-button-secondary">
          GitHub
        </a>
        {/* Replace # with the poster or PDF file URL. */}
        <a href="#" className="landing-button landing-button-ghost">
          Poster / PDF
        </a>
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
              <small>AI security systems showcase</small>
            </span>
          </div>
          <div className="landing-nav-actions">
            <a href="#projects">Projects</a>
            <a href="#team">Team</a>
            <Link to="/app" className="landing-nav-button">
              Open Dashboard
            </Link>
          </div>
        </nav>

        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="landing-kicker">QR Visitor Landing Page</p>
            <h1>AI-powered cybersecurity projects built for detection, scoring, and response.</h1>
            <p className="landing-hero-text">
              Explore two machine-learning security systems focused on phishing detection and network intrusion monitoring, with dashboards, explainable outputs, and production-style workflows.
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
          <h2>Two security systems, one exhibition-ready landing page.</h2>
          <p>
            The showcase is designed for QR-code visitors who need a quick, professional overview before opening the full dashboard or project assets.
          </p>
        </div>

        <div className="landing-project-grid">
          {projects.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
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
          <p className="landing-kicker">Dashboard Preview</p>
          <h2>Screenshot placeholder for exhibition visuals.</h2>
          <p>
            Replace this area later with a real dashboard screenshot, architecture diagram, poster image, or project demo capture.
          </p>
        </div>
        <div className="landing-screenshot-placeholder">
          <div className="placeholder-topbar">
            <span />
            <span />
            <span />
          </div>
          <div className="placeholder-body">
            <div className="placeholder-sidebar" />
            <div className="placeholder-content">
              <div className="placeholder-line wide" />
              <div className="placeholder-card-row">
                <div />
                <div />
                <div />
              </div>
              <div className="placeholder-chart" />
            </div>
          </div>
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
