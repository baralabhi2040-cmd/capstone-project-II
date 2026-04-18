import { useDemoGuide } from "../../hooks/useDemoGuide";

function DemoGuideControls() {
  const {
    currentStep,
    currentStepIndex,
    steps,
    nextStep,
    prevStep,
    skipStep,
    skipSection,
    exitGuide,
    pauseGuide,
    restartGuide,
    goToStep,
  } = useDemoGuide();
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  return (
    <div className="demo-guide-controls">
      <div className="demo-guide-control-row">
        <button
          type="button"
          className="button button-secondary demo-guide-button"
          onClick={prevStep}
          disabled={isFirst}
        >
          Back
        </button>
        <button
          type="button"
          className="button button-secondary demo-guide-button"
          onClick={() => skipStep()}
        >
          Skip Step
        </button>
        <button
          type="button"
          className="button button-secondary demo-guide-button"
          onClick={skipSection}
        >
          Skip Section
        </button>
        <button
          type="button"
          className="button button-primary demo-guide-button"
          onClick={nextStep}
        >
          {isLast ? "Finish Tour" : currentStep.optionalCtaText || "Next"}
        </button>
      </div>

      <div className="demo-guide-control-row demo-guide-secondary-row">
        <button
          type="button"
          className="demo-guide-text-button"
          onClick={pauseGuide}
        >
          Resume Later
        </button>
        <button
          type="button"
          className="demo-guide-text-button"
          onClick={restartGuide}
        >
          Restart Tour
        </button>
        <button
          type="button"
          className="demo-guide-text-button danger"
          onClick={exitGuide}
        >
          Exit Tour
        </button>
        <label className="demo-guide-jump-label">
          Jump
          <select
            className="demo-guide-jump-select"
            value={currentStepIndex}
            onChange={(event) => goToStep(Number(event.target.value))}
          >
            {steps.map((step, index) => (
              <option key={step.id} value={index}>
                {index + 1}. {step.title}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export default DemoGuideControls;
