import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { demoGuideSteps } from "../../config/demoGuideSteps";
import DemoGuideOverlay from "./DemoGuideOverlay";
import "./demoGuide.css";

const STORAGE_KEYS = {
  currentStep: "demoGuide.currentStep",
  isActive: "demoGuide.isActive",
  isPaused: "demoGuide.isPaused",
  lastRoute: "demoGuide.lastRoute",
  completedSteps: "demoGuide.completedSteps",
  skippedSteps: "demoGuide.skippedSteps",
};

export const DemoGuideContext = createContext(null);

const clampStepIndex = (index) =>
  Math.max(0, Math.min(demoGuideSteps.length - 1, Number(index) || 0));

const readStoredNumber = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  return value == null ? fallback : clampStepIndex(value);
};

const readStoredBoolean = (key, fallback = false) => {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (value == null) return fallback;
  return value === "true";
};

const readStoredArray = (key) => {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeStorage = (key, value) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    key,
    typeof value === "string" ? value : JSON.stringify(value)
  );
};

function pathMatchesStepRoute(pathname, route) {
  const normalize = (value) => value.replace(/\/+$/, "") || "/";
  return normalize(pathname) === normalize(route);
}

export function DemoGuideProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(() =>
    readStoredNumber(STORAGE_KEYS.currentStep, 0)
  );
  const [isActive, setIsActive] = useState(() =>
    readStoredBoolean(STORAGE_KEYS.isActive, false)
  );
  const [isPaused, setIsPaused] = useState(() =>
    readStoredBoolean(STORAGE_KEYS.isPaused, false)
  );
  const [completedSteps, setCompletedSteps] = useState(() =>
    readStoredArray(STORAGE_KEYS.completedSteps)
  );
  const [skippedSteps, setSkippedSteps] = useState(() =>
    readStoredArray(STORAGE_KEYS.skippedSteps)
  );

  const steps = demoGuideSteps;
  const currentStep = steps[currentStepIndex] || steps[0];

  const goToStep = useCallback((index) => {
    setCurrentStepIndex(clampStepIndex(index));
    setIsActive(true);
    setIsPaused(false);
  }, []);

  const startGuide = useCallback(
    (index = 0) => {
      setCompletedSteps([]);
      setSkippedSteps([]);
      goToStep(index);
    },
    [goToStep]
  );

  const restartGuide = useCallback(() => {
    startGuide(0);
  }, [startGuide]);

  const exitGuide = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
  }, []);

  const pauseGuide = useCallback(() => {
    setIsActive(false);
    setIsPaused(true);
  }, []);

  const resumeGuide = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
  }, []);

  const completeStep = useCallback((stepId) => {
    setCompletedSteps((current) =>
      current.includes(stepId) ? current : [...current, stepId]
    );
  }, []);

  const markSkipped = useCallback((stepId) => {
    setSkippedSteps((current) =>
      current.includes(stepId) ? current : [...current, stepId]
    );
  }, []);

  const nextStep = useCallback(() => {
    const stepId = steps[currentStepIndex]?.id;
    if (stepId) completeStep(stepId);

    if (currentStepIndex >= steps.length - 1) {
      setIsActive(false);
      setIsPaused(false);
      return;
    }

    setCurrentStepIndex((current) => clampStepIndex(current + 1));
  }, [completeStep, currentStepIndex, steps]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((current) => clampStepIndex(current - 1));
  }, []);

  const skipStep = useCallback(
    (reason = "manual") => {
      const step = steps[currentStepIndex];
      if (step) {
        if (reason !== "manual") {
          console.warn(`Demo guide skipped step "${step.id}": ${reason}`);
        }
        markSkipped(step.id);
      }
      if (currentStepIndex >= steps.length - 1) {
        setIsActive(false);
        setIsPaused(false);
        return;
      }
      setCurrentStepIndex((current) => clampStepIndex(current + 1));
    },
    [currentStepIndex, markSkipped, steps]
  );

  const skipSection = useCallback(() => {
    const currentSection = steps[currentStepIndex]?.section;
    if (!currentSection) {
      skipStep();
      return;
    }

    const nextSectionIndex = steps.findIndex(
      (step, index) => index > currentStepIndex && step.section !== currentSection
    );
    const targetIndex = nextSectionIndex === -1 ? steps.length : nextSectionIndex;
    const skippedIds = steps
      .slice(currentStepIndex, targetIndex)
      .map((step) => step.id);

    setSkippedSteps((current) => Array.from(new Set([...current, ...skippedIds])));

    if (targetIndex >= steps.length) {
      setIsActive(false);
      setIsPaused(false);
      return;
    }

    setCurrentStepIndex(targetIndex);
  }, [currentStepIndex, skipStep, steps]);

  useEffect(() => {
    if (!isActive || !currentStep?.route) return;
    if (!pathMatchesStepRoute(location.pathname, currentStep.route)) {
      navigate(currentStep.route);
    }
  }, [currentStep, isActive, location.pathname, navigate]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.currentStep, String(currentStepIndex));
    writeStorage(STORAGE_KEYS.isActive, String(isActive));
    writeStorage(STORAGE_KEYS.isPaused, String(isPaused));
    writeStorage(STORAGE_KEYS.lastRoute, location.pathname);
    writeStorage(STORAGE_KEYS.completedSteps, completedSteps);
    writeStorage(STORAGE_KEYS.skippedSteps, skippedSteps);
  }, [
    completedSteps,
    currentStepIndex,
    isActive,
    isPaused,
    location.pathname,
    skippedSteps,
  ]);

  const value = useMemo(
    () => ({
      isActive,
      isPaused,
      currentStepIndex,
      currentStep,
      steps,
      completedSteps,
      skippedSteps,
      lastVisitedStep: currentStepIndex,
      startGuide,
      nextStep,
      prevStep,
      skipStep,
      skipSection,
      exitGuide,
      pauseGuide,
      resumeGuide,
      restartGuide,
      goToStep,
    }),
    [
      completedSteps,
      currentStep,
      currentStepIndex,
      exitGuide,
      goToStep,
      isActive,
      isPaused,
      nextStep,
      pauseGuide,
      prevStep,
      restartGuide,
      resumeGuide,
      skipSection,
      skipStep,
      skippedSteps,
      startGuide,
      steps,
    ]
  );

  return (
    <DemoGuideContext.Provider value={value}>
      {children}
      <DemoGuideOverlay />
    </DemoGuideContext.Provider>
  );
}
