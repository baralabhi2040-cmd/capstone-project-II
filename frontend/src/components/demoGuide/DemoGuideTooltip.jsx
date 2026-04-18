import { useMemo } from "react";
import { useDemoGuide } from "../../hooks/useDemoGuide";
import DemoGuideControls from "./DemoGuideControls";
import DemoGuideProgress from "./DemoGuideProgress";

const CARD_WIDTH = 420;
const EDGE_PADDING = 18;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getTooltipPosition(rect, placement = "bottom") {
  if (!rect) {
    return {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxLeft = viewportWidth - CARD_WIDTH - EDGE_PADDING;
  const centeredLeft = rect.left + rect.width / 2 - CARD_WIDTH / 2;

  if (placement === "left") {
    return {
      left: clamp(rect.left - CARD_WIDTH - 22, EDGE_PADDING, maxLeft),
      top: clamp(rect.top, EDGE_PADDING, viewportHeight - 420),
    };
  }

  if (placement === "right") {
    return {
      left: clamp(rect.left + rect.width + 22, EDGE_PADDING, maxLeft),
      top: clamp(rect.top, EDGE_PADDING, viewportHeight - 420),
    };
  }

  if (placement === "top") {
    return {
      left: clamp(centeredLeft, EDGE_PADDING, maxLeft),
      top: clamp(rect.top - 340, EDGE_PADDING, viewportHeight - 420),
    };
  }

  return {
    left: clamp(centeredLeft, EDGE_PADDING, maxLeft),
    top: clamp(rect.top + rect.height + 20, EDGE_PADDING, viewportHeight - 420),
  };
}

function DemoGuideTooltip({ targetRect }) {
  const { currentStep, currentStepIndex, steps, completedSteps, skippedSteps } =
    useDemoGuide();
  const style = useMemo(
    () => getTooltipPosition(targetRect, currentStep.placement),
    [currentStep.placement, targetRect]
  );

  return (
    <section className="demo-guide-tooltip" style={style}>
      <div className="demo-guide-tooltip-glow" />
      <div className="demo-guide-pill-row">
        <span className="demo-guide-pill">Live Demo Guidance</span>
        <span className="demo-guide-pill muted">{currentStep.section}</span>
      </div>

      <DemoGuideProgress current={currentStepIndex + 1} total={steps.length} />

      <div className="demo-guide-copy">
        <p className="demo-guide-kicker">
          {completedSteps.length} completed · {skippedSteps.length} skipped
        </p>
        <h3>{currentStep.title}</h3>
        <p>{currentStep.description}</p>
        {currentStep.tip ? (
          <div className="demo-guide-tip">
            <strong>Presenter tip</strong>
            <span>{currentStep.tip}</span>
          </div>
        ) : null}
      </div>

      <DemoGuideControls />
    </section>
  );
}

export default DemoGuideTooltip;
