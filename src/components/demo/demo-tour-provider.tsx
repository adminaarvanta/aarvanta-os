"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { usePlan } from "@/components/billing/plan-context";
import {
  DEMO_TOUR_STEP_KEY,
  DEMO_TOUR_STORAGE_KEY,
  tourStepsForPlan,
  walkthroughSeenStorageKey,
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

function readLocalSeen(userId: string | null | undefined) {
  if (!userId || typeof window === "undefined") return false;
  try {
    return localStorage.getItem(walkthroughSeenStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

function writeLocalSeen(userId: string | null | undefined, seen: boolean) {
  if (!userId || typeof window === "undefined") return;
  try {
    const key = walkthroughSeenStorageKey(userId);
    if (seen) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

async function persistWalkthroughSeen() {
  try {
    await fetch("/api/tenant/me/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasSeenWalkthrough: true }),
    });
  } catch {
    /* offline / demo — localStorage still covers instant skip */
  }
}

export function DemoTourProvider({
  children,
  userId = null,
  hasSeenWalkthrough = false,
  autoStartWalkthrough = false,
}: {
  children: React.ReactNode;
  userId?: string | null;
  hasSeenWalkthrough?: boolean;
  /** Production Free first-run only — skipped in demo mode. */
  autoStartWalkthrough?: boolean;
}) {
  const router = useRouter();
  const plan = usePlan();
  const planId = plan?.planId ?? null;
  const steps = useMemo(() => tourStepsForPlan(planId), [planId]);

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [seen, setSeen] = useState(
    () => hasSeenWalkthrough || readLocalSeen(userId)
  );
  const autoStartedRef = useRef(false);

  const step = steps[stepIndex] ?? steps[0];
  const totalSteps = steps.length;

  useEffect(() => {
    setSeen(hasSeenWalkthrough || readLocalSeen(userId));
  }, [hasSeenWalkthrough, userId]);

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
      const next = steps[index];
      if (!next?.route) return;
      setPendingRoute(next.route);
      router.push(next.route);
    },
    [router, steps]
  );

  const markWalkthroughSeen = useCallback(() => {
    if (planId !== "free") return;
    setSeen(true);
    writeLocalSeen(userId, true);
    void persistWalkthroughSeen();
  }, [planId, userId]);

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
    markWalkthroughSeen();
  }, [markWalkthroughSeen, persistActive]);

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

  // Resume mid-tour within the same tab.
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

  // Free first-run auto-start (production only via prop).
  useEffect(() => {
    if (!autoStartWalkthrough) return;
    if (autoStartedRef.current) return;
    if (planId !== "free") return;
    if (seen) return;
    if (active) return;
    if (sessionStorage.getItem(DEMO_TOUR_STORAGE_KEY) === "1") return;

    autoStartedRef.current = true;
    const timer = window.setTimeout(() => startTour(0), 600);
    return () => window.clearTimeout(timer);
  }, [active, autoStartWalkthrough, planId, seen, startTour]);

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
