function DemoGuideSpotlight({ rect }) {
  if (!rect) {
    return <div className="demo-guide-ambient" aria-hidden="true" />;
  }

  return (
    <div
      className="demo-guide-spotlight"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
      aria-hidden="true"
    />
  );
}

export default DemoGuideSpotlight;
