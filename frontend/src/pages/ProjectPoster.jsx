import { useState } from "react";
import { Link } from "react-router-dom";
import "./ProjectPoster.css";

const POSTER_PREVIEW_URL = "/assets/poster/poster-preview.jpg";
const POSTER_PDF_URL = "/assets/poster/poster.pdf";

function PosterPlaceholder() {
  return (
    <div className="poster-empty-state">
      <div className="poster-empty-icon">PG</div>
      <h3>Poster preview is ready to be added</h3>
      <p>
        Add your exhibition poster image as <strong>poster-preview.jpg</strong> in
        the public poster folder to show it here automatically.
      </p>
    </div>
  );
}

function ProjectPoster() {
  const [posterImageLoaded, setPosterImageLoaded] = useState(true);

  return (
    <div className="page-stack poster-page">
      <section className="card poster-hero-card">
        <div>
          <p className="hero-kicker">Presentation resources</p>
          <h3 className="hero-title">PhishGuard Poster & Report</h3>
          <p className="hero-description">
            A polished exhibition area for showing the project poster, opening the
            PDF report, and guiding an audience from the capstone summary into the
            live phishing detection walkthrough.
          </p>
          <div className="row wrap poster-action-row">
            <a
              className="button button-primary"
              href={POSTER_PDF_URL}
              target="_blank"
              rel="noreferrer"
            >
              View Poster
            </a>
            <a className="button button-secondary" href={POSTER_PDF_URL} download>
              Download PDF
            </a>
            <a
              className="button button-secondary"
              href={posterImageLoaded ? POSTER_PREVIEW_URL : POSTER_PDF_URL}
              target="_blank"
              rel="noreferrer"
            >
              Open Fullscreen
            </a>
            <Link className="button button-secondary" to="/app">
              Launch Dashboard
            </Link>
          </div>
        </div>
        <div className="poster-hero-stats">
          <div>
            <span>Channels</span>
            <strong>4</strong>
            <small>URL, Email, SMS, Social</small>
          </div>
          <div>
            <span>Output</span>
            <strong>0-100</strong>
            <small>Hybrid threat score</small>
          </div>
        </div>
      </section>

      <section className="poster-layout">
        <div className="card poster-preview-card">
          <div className="chart-card-header">
            <div>
              <p className="small">Poster preview</p>
              <h3>Capstone Exhibition Poster</h3>
            </div>
            <span className="badge badge-success">PDF ready</span>
          </div>

          <div className="poster-frame">
            {posterImageLoaded ? (
              <a href={POSTER_PREVIEW_URL} target="_blank" rel="noreferrer">
                <img
                  src={POSTER_PREVIEW_URL}
                  alt="PhishGuard project poster preview"
                  onError={() => setPosterImageLoaded(false)}
                />
              </a>
            ) : (
              <PosterPlaceholder />
            )}
          </div>
        </div>

        <aside className="poster-side-stack">
          <div className="card poster-summary-card">
            <p className="hero-kicker">Project summary</p>
            <h3>AI-Based Multi-Channel Phishing Detection System</h3>
            <p className="muted">
              PhishGuard detects phishing attempts across URLs, emails, SMS, and
              social messages using machine learning, rule-based detection,
              explainable indicators, and a live cybersecurity dashboard.
            </p>
            <div className="poster-tag-grid">
              <span>React + Vite</span>
              <span>FastAPI</span>
              <span>Python</span>
              <span>Scikit-learn</span>
              <span>Threat scoring</span>
              <span>Guided demo mode</span>
            </div>
          </div>

          <div className="card poster-resource-card">
            <p className="hero-kicker">Presentation resources</p>
            <div className="poster-resource-list">
              <a href={POSTER_PDF_URL} target="_blank" rel="noreferrer">
                <strong>Open PDF in new tab</strong>
                <span>Ready to view</span>
              </a>
              <a href={POSTER_PREVIEW_URL} target="_blank" rel="noreferrer">
                <strong>Open poster image</strong>
                <span>Preview image ready</span>
              </a>
              <Link to="/app/scan/url">
                <strong>Run live URL demo</strong>
                <span>Move from poster to real detection</span>
              </Link>
            </div>
          </div>

          <div className="card poster-team-card">
            <p className="hero-kicker">Team</p>
            <div className="poster-team-grid">
              <span>Abhishek Baral</span>
              <span>Paban Oli</span>
              <span>Rohit Shrestha</span>
            </div>
            <p className="muted poster-supervisor">
              Supervisor: <strong>Dr Md Arafat Mahmud</strong>
            </p>
          </div>

          <div className="card poster-qr-card">
            <p className="hero-kicker">QR access</p>
            <div className="poster-qr-content">
              <img
                src="/phishguard-final-qr.png"
                alt="QR code for PhishGuard live demo"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <p className="muted">
                Use this space during presentations to let visitors open the live
                PhishGuard demo from their phones.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="card poster-pdf-embed-card">
        <div className="chart-card-header">
          <div>
            <p className="small">PDF preview</p>
            <h3>Embedded report viewer</h3>
          </div>
          <a
            className="button button-secondary button-inline"
            href={POSTER_PDF_URL}
            target="_blank"
            rel="noreferrer"
          >
            Open PDF
          </a>
        </div>

        <iframe
          className="poster-pdf-frame"
          title="PhishGuard poster PDF preview"
          src={POSTER_PDF_URL}
        />
      </section>
    </div>
  );
}

export default ProjectPoster;
