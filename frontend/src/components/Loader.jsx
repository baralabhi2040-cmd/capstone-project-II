function Loader({ text = "Loading..." }) {
  return (
    <div className="card centered loader-panel">
      <div className="loader-radar">
        <div className="loader-ring loader-ring-a" />
        <div className="loader-ring loader-ring-b" />
        <div className="loader-core" />
      </div>
      <h3 className="loader-title">Running analysis</h3>
      <p className="muted">{text}</p>
    </div>
  );
}

export default Loader;
