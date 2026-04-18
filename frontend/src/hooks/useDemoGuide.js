import { useContext } from "react";
import { DemoGuideContext } from "../components/demoGuide/DemoGuideProvider";

export function useDemoGuide() {
  const context = useContext(DemoGuideContext);
  if (!context) {
    throw new Error("useDemoGuide must be used inside DemoGuideProvider.");
  }
  return context;
}
