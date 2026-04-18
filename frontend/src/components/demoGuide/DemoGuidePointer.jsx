import { useMemo } from "react";
import { useDemoGuide } from "../../hooks/useDemoGuide";

const EDGE_PADDING = 24;

function clamp(value, min, max) {
  if (max < min) return min;
  return Math.max(min, Math.min(max, value));
}

function getPointerPoint(rect) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (!rect) {
    return {
      x: viewportWidth / 2,
      y: viewportHeight / 2,
      labelSide: "right",
      labelLift: "down",
    };
  }

  const innerX = rect.width > 80 ? rect.width * 0.68 : rect.width / 2;
  const innerY = rect.height > 80 ? Math.min(rect.height * 0.48, 140) : rect.height / 2;
  const x = clamp(rect.left + innerX, EDGE_PADDING, viewportWidth - EDGE_PADDING);
  const y = clamp(rect.top + innerY, EDGE_PADDING, viewportHeight - EDGE_PADDING);

  return {
    x,
    y,
    labelSide: x > viewportWidth - 380 ? "left" : "right",
    labelLift: y > viewportHeight - 180 ? "up" : "down",
  };
}

function DemoGuidePointer({ targetRect }) {
  const {
    currentStep,
    currentStepIndex,
    steps,
    nextStep,
    prevStep,
    skipStep,
    exitGuide,
    restartGuide,
  } = useDemoGuide();
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;
  const progress = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  const pointer = useMemo(() => getPointerPoint(targetRect), [targetRect]);

  return (
    <>
      <div
        className={`demo-guide-pointer label-${pointer.labelSide} label-${pointer.labelLift}`}
        style={{ left: pointer.x, top: pointer.y }}
        aria-hidden="true"
      >
        <span className="demo-guide-click-pulse" />
        <svg
          className="demo-guide-cursor"
          viewBox="0 0 32 32"
          role="img"
          aria-label="Guided demo pointer"
        >
          <path
            d="M5 3L6.8 26.6L13.2 20.9L17.5 30L22.2 27.8L17.8 18.8L26.6 18.4L5 3Z"
            fill="currentColor"
          />
          <path
            d="M5 3L6.8 26.6L13.2 20.9L17.5 30L22.2 27.8L17.8 18.8L26.6 18.4L5 3Z"
            fill="none"
            stroke="rgba(255,255,255,0.82)"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
        </svg>
        <div className="demo-guide-pointer-chip">
          <span>
            Step {currentStepIndex + 1}/{steps.length} - {currentStep.section}
          </span>
          <strong>{currentStep.title}</strong>
        </div>
      </div>

      <div className="demo-guide-info-ribbon" key={currentStep.id} role="status">
        <div className="demo-guide-info-main">
          <span>
            Step {currentStepIndex + 1} of {steps.length} -{" "}
            {currentStep.section}
          </span>
          <strong>{currentStep.title}</strong>
          <p>{currentStep.description}</p>
        </div>
      </div>

      <div className="demo-guide-remote" role="toolbar" aria-label="Live demo controls">
        <div className="demo-guide-remote-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <span className="demo-guide-remote-step">
          {currentStepIndex + 1}/{steps.length}
        </span>
        <button
          type="button"
          className="demo-guide-remote-button"
          onClick={prevStep}
          disabled={isFirst}
        >
          Back
        </button>
        <button
          type="button"
          className="demo-guide-remote-button primary"
          onClick={nextStep}
        >
          {isLast ? "Finish" : currentStep.optionalCtaText || "Next"}
        </button>
        <button
          type="button"
          className="demo-guide-remote-button"
          onClick={() => skipStep()}
        >
          Skip Step
        </button>
        <button
          type="button"
          className="demo-guide-remote-button"
          onClick={restartGuide}
        >
          Restart
        </button>
        <button
          type="button"
          className="demo-guide-remote-button danger"
          onClick={exitGuide}
        >
          Exit
        </button>
      </div>
    </>
  );
}

export default DemoGuidePointer;
