"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_TOUR_STEPS,
  DEMO_TOUR_STEP_KEY,
  DEMO_TOUR_STORAGE_KEY,
  type DemoTourStep,
} from "@/lib/demo/tour-steps";

type DemoTourContextValue = {
  active: boolean;
  stepIndex: number;
  step: DemoTourStep;
  totalSteps: number;
  startTour: (fromStep?: number) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
};

const DemoTourContext = createContext<DemoTourContextValue | null>(null);

export function DemoTourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  const step = DEMO_TOUR_STEPS[stepIndex] ?? DEMO_TOUR_STEPS[0];
  const totalSteps = DEMO_TOUR_STEPS.length;

  const persistActive = useCallback((value: boolean, index = stepIndex) => {
    if (value) {
      sessionStorage.setItem(DEMO_TOUR_STORAGE_KEY, "1");
      sessionStorage.setItem(DEMO_TOUR_STEP_KEY, String(index));
    } else {
      sessionStorage.removeItem(DEMO_TOUR_STORAGE_KEY);
      sessionStorage.removeItem(DEMO_TOUR_STEP_KEY);
    }
  }, [stepIndex]);

  const navigateForStep = useCallback(
    (index: number) => {
      const next = DEMO_TOUR_STEPS[index];
      if (!next?.route) return;
      setPendingRoute(next.route);
      router.push(next.route);
    },
    [router]
  );

  const startTour = useCallback(
    (fromStep = 0) => {
      const clamped = Math.max(0, Math.min(fromStep, totalSteps - 1));
      setStepIndex(clamped);
      setActive(true);
      persistActive(true, clamped);
      navigateForStep(clamped);
    },
    [navigateForStep, persistActive, totalSteps]
  );

  const endTour = useCallback(() => {
    setActive(false);
    setPendingRoute(null);
    persistActive(false);
  }, [persistActive]);

  const goToStep = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, totalSteps - 1));
      setStepIndex(clamped);
      persistActive(true, clamped);
      navigateForStep(clamped);
    },
    [navigateForStep, persistActive, totalSteps]
  );

  const nextStep = useCallback(() => {
    if (stepIndex >= totalSteps - 1) {
      endTour();
      return;
    }
    goToStep(stepIndex + 1);
  }, [endTour, goToStep, stepIndex, totalSteps]);

  const prevStep = useCallback(() => {
    if (stepIndex <= 0) return;
    goToStep(stepIndex - 1);
  }, [goToStep, stepIndex]);

  useEffect(() => {
    if (sessionStorage.getItem(DEMO_TOUR_STORAGE_KEY) === "1") {
      const saved = Number(sessionStorage.getItem(DEMO_TOUR_STEP_KEY) ?? "0");
      const clamped = Number.isFinite(saved)
        ? Math.max(0, Math.min(saved, totalSteps - 1))
        : 0;
      setStepIndex(clamped);
      setActive(true);
    }
  }, [totalSteps]);

  useEffect(() => {
    if (!pendingRoute) return;
    const timer = window.setTimeout(() => setPendingRoute(null), 400);
    return () => window.clearTimeout(timer);
  }, [pendingRoute, stepIndex]);

  useEffect(() => {
    if (!active) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        endTour();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextStep();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        prevStep();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, endTour, nextStep, prevStep]);

  const value = useMemo(
    () => ({
      active,
      stepIndex,
      step,
      totalSteps,
      startTour,
      endTour,
      nextStep,
      prevStep,
      goToStep,
    }),
    [
      active,
      endTour,
      goToStep,
      nextStep,
      prevStep,
      startTour,
      step,
      stepIndex,
      totalSteps,
    ]
  );

  return (
    <DemoTourContext.Provider value={value}>{children}</DemoTourContext.Provider>
  );
}

export function useDemoTour() {
  const context = useContext(DemoTourContext);
  if (!context) {
    throw new Error("useDemoTour must be used within DemoTourProvider");
  }
  return context;
}

export function useDemoTourOptional() {
  return useContext(DemoTourContext);
}
