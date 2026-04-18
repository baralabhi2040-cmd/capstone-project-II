import { useState } from "react";
import "./Showcase.css";

const dashboardPreview = {
  title: "System Dashboard",
  image: "/assets/dashboard/dashboard-preview.png",
  caption:
    "A command-center view of scan volume, phishing detections, channel distribution, and risk trends.",
};

const scannerPreviews = [
  {
    title: "URL Scanner",
    image: "/assets/scanners/url-scan.png",
    caption:
      "Shows link analysis, hybrid threat scoring, suspicious URL signals, and recommended user action.",
  },
  {
    title: "Email Scanner",
    image: "/assets/scanners/email-scan.png",
    caption:
      "Demonstrates sender, subject, and body analysis for impersonation, urgency, and credential requests.",
  },
  {
    title: "SMS Scanner",
    image: "/assets/scanners/sms-scan.png",
    caption:
      "Highlights smishing patterns such as short-code abuse, prize lures, parcel scams, and urgent links.",
  },
  {
    title: "Social Scanner",
    image: "/assets/scanners/social-scan.png",
    caption:
      "Presents platform-aware checks for fake giveaways, support impersonation, and crypto scam language.",
  },
];

const posterPreview = {
  title: "Project Poster & Report",
  image: "/assets/poster/poster-preview.jpg",
  pdf: "/assets/poster/poster.pdf",
  caption:
    "Use this section during a live exhibition to move from the academic poster into the working product demo.",
};

function ImagePreviewCard({ title, image, caption, onOpen }) {
  return (
    <article className="showcase-image-card">
      <button
        type="button"
        className="showcase-image-button"
        onClick={() => onOpen({ title, image })}
      >
        <img src={image} alt={`${title} preview`} loading="lazy" />
        <span>Open preview</span>
      </button>
      <div className="showcase-card-copy">
        <h4>{title}</h4>
        <p>{caption}</p>
      </div>
    </article>
  );
}

function Showcase() {
  const [activePreview, setActivePreview] = useState(null);

  return (
    <div className="page-stack showcase-page">
      <section className="card showcase-hero">
        <div>
          <p className="hero-kicker">Visual showcase</p>
          <h3 className="hero-title">PhishGuard System Preview</h3>
          <p className="hero-description">
            A presentation-ready gallery for dashboard screenshots, scanner flows,
            and poster resources. Use it to visually explain how the phishing
            detection platform works before running a live scan.
          </p>
        </div>
        <div className="showcase-hero-panel">
          <span className="badge badge-success">Demo ready</span>
          <strong>Dashboard + 4 scanner lanes</strong>
          <p>
            Static previews are served from the Vite public folder, making them
            compatible with local development, Vercel, and QR-based demos.
          </p>
        </div>
      </section>

      <section className="card showcase-section">
        <div className="chart-card-header">
          <div>
            <p className="small">Section 1</p>
            <h3>{dashboardPreview.title}</h3>
          </div>
          <span className="badge badge-neutral">Command center</span>
        </div>
        <div className="showcase-dashboard-layout">
          <ImagePreviewCard
            title={dashboardPreview.title}
            image={dashboardPreview.image}
            caption={dashboardPreview.caption}
            onOpen={setActivePreview}
          />
          <div className="showcase-notes-card">
            <h4>What this preview shows</h4>
            <p>
              The dashboard gives examiners a fast visual summary of total scans,
              phishing volume, legitimate results, most targeted channel, risk
              distribution, and activity trend.
            </p>
            <div className="showcase-tag-row">
              <span>Total scans</span>
              <span>Risk mix</span>
              <span>Channel analytics</span>
              <span>Activity trend</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card showcase-section">
        <div className="chart-card-header">
          <div>
            <p className="small">Section 2</p>
            <h3>Scanner Previews</h3>
          </div>
          <span className="badge badge-neutral">URL, Email, SMS, Social</span>
        </div>
        <div className="showcase-scanner-grid">
          {scannerPreviews.map((preview) => (
            <ImagePreviewCard
              key={preview.title}
              title={preview.title}
              image={preview.image}
              caption={preview.caption}
              onOpen={setActivePreview}
            />
          ))}
        </div>
      </section>

      <section className="card showcase-section">
        <div className="chart-card-header">
          <div>
            <p className="small">Section 3</p>
            <h3>{posterPreview.title}</h3>
          </div>
          <span className="badge badge-success">Poster assets</span>
        </div>
        <div className="showcase-poster-layout">
          <ImagePreviewCard
            title="Project Poster"
            image={posterPreview.image}
            caption={posterPreview.caption}
            onOpen={setActivePreview}
          />
          <div className="showcase-poster-actions">
            <h4>Poster / Report</h4>
            <p>
              Open the poster PDF for marking, presentation, or QR display. The
              same files are also used by the dedicated Project Poster page.
            </p>
            <div className="row wrap">
              <a
                className="button button-primary"
                href={posterPreview.pdf}
                target="_blank"
                rel="noreferrer"
              >
                View Poster
              </a>
              <a className="button button-secondary" href={posterPreview.pdf} download>
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </section>

      {activePreview ? (
        <div className="showcase-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="showcase-modal-backdrop"
            aria-label="Close preview"
            onClick={() => setActivePreview(null)}
          />
          <div className="showcase-modal-card">
            <div className="row-between wrap">
              <h3>{activePreview.title}</h3>
              <button
                type="button"
                className="button button-secondary button-inline"
                onClick={() => setActivePreview(null)}
              >
                Close
              </button>
            </div>
            <img src={activePreview.image} alt={`${activePreview.title} enlarged preview`} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Showcase;
