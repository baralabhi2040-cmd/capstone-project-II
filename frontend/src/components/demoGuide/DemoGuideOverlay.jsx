import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDemoGuide } from "../../hooks/useDemoGuide";
import DemoGuidePointer from "./DemoGuidePointer";
import DemoGuideSpotlight from "./DemoGuideSpotlight";

const SPOTLIGHT_PADDING = 8;
const VIEWPORT_MARGIN = 10;
const MAX_TARGET_ATTEMPTS = 10;

function getPaddedRect(rect) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const top = Math.max(VIEWPORT_MARGIN, rect.top - SPOTLIGHT_PADDING);
  const left = Math.max(VIEWPORT_MARGIN, rect.left - SPOTLIGHT_PADDING);

  return {
    top,
    left,
    width: Math.min(
      rect.width + SPOTLIGHT_PADDING * 2,
      viewportWidth - left - VIEWPORT_MARGIN
    ),
    height: Math.min(
      rect.height + SPOTLIGHT_PADDING * 2,
      viewportHeight - top - VIEWPORT_MARGIN
    ),
  };
}

function DemoGuideOverlay() {
  const { isActive, currentStep, skipStep } = useDemoGuide();
  const location = useLocation();
  const [targetRect, setTargetRect] = useState(null);
  const [targetReady, setTargetReady] = useState(false);

  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetRect(null);
      setTargetReady(false);
      return undefined;
    }

    let cancelled = false;
    let attempt = 0;
    let retryId = null;

    const measureTarget = () => {
      if (cancelled) return;

      if (!currentStep.target) {
        setTargetReady(true);
        setTargetRect(null);
        return;
      }

      const target = document.querySelector(currentStep.target);
      if (!target) {
        attempt += 1;
        if (attempt >= MAX_TARGET_ATTEMPTS) {
          skipStep(`missing target ${currentStep.target}`);
          return;
        }
        retryId = window.setTimeout(measureTarget, 220);
        return;
      }

      target.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "smooth",
      });

      window.setTimeout(() => {
        if (cancelled) return;
        const rect = target.getBoundingClientRect();
        setTargetRect(getPaddedRect(rect));
        setTargetReady(true);
      }, 260);
    };

    measureTarget();

    const handleViewportChange = () => {
      const target = currentStep.target
        ? document.querySelector(currentStep.target)
        : null;
      if (!target) return;
      setTargetRect(getPaddedRect(target.getBoundingClientRect()));
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      cancelled = true;
      if (retryId) window.clearTimeout(retryId);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [currentStep, isActive, location.pathname, skipStep]);

  const overlayClass = useMemo(
    () => `demo-guide-overlay ${targetReady ? "is-ready" : ""}`,
    [targetReady]
  );

  if (!isActive || !currentStep) return null;

  return (
    <div className={overlayClass} aria-live="polite">
      <DemoGuideSpotlight rect={targetRect} />
      <DemoGuidePointer targetRect={targetRect} />
    </div>
  );
}

export default DemoGuideOverlay;
