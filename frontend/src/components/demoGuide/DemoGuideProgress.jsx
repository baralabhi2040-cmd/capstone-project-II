function DemoGuideProgress({ current, total }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="demo-guide-progress" aria-label={`Step ${current} of ${total}`}>
      <div className="demo-guide-progress-meta">
        <span>Step {current} of {total}</span>
        <span>{percent}%</span>
      </div>
      <div className="demo-guide-progress-track">
        <div
          className="demo-guide-progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default DemoGuideProgress;
