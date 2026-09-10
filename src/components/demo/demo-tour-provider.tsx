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
import { usePathname, useRouter } from "next/navigation";
import { usePlan } from "@/components/billing/plan-context";
import {
  DEMO_TOUR_NAME_KEY,
  DEMO_TOUR_STEP_KEY,
  DEMO_TOUR_STORAGE_KEY,
  MODULE_TOURS,
  isModuleTourId,
  tourIdForPath,
  tourStepsForPlan,
  toursCompletedStorageKey,
  walkthroughSeenStorageKey,
  type DemoTourStep,
  type ModuleTourId,
} from "@/lib/demo/tour-steps";

type NamedTourId = "product" | ModuleTourId;

type DemoTourContextValue = {
  active: boolean;
  stepIndex: number;
  step: DemoTourStep;
  totalSteps: number;
  namedTour: NamedTourId;
  startTour: (fromStep?: number) => void;
  startModuleTour: (id: ModuleTourId) => void;
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

function readLocalTours(userId: string | null | undefined): Record<string, string> {
  if (!userId || typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(toursCompletedStorageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function writeLocalTours(
  userId: string | null | undefined,
  tours: Record<string, string>
) {
  if (!userId || typeof window === "undefined") return;
  try {
    localStorage.setItem(toursCompletedStorageKey(userId), JSON.stringify(tours));
  } catch {
    /* ignore */
  }
}

async function persistPreferences(patch: {
  hasSeenWalkthrough?: boolean;
  toursCompleted?: Record<string, string>;
}) {
  try {
    await fetch("/api/tenant/me/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  } catch {
    /* offline / demo — localStorage still covers instant skip */
  }
}

function stepsForNamedTour(
  named: NamedTourId,
  planId: string | null
): DemoTourStep[] {
  if (named === "product") return tourStepsForPlan(planId);
  return MODULE_TOURS[named];
}

export function DemoTourProvider({
  children,
  userId = null,
  hasSeenWalkthrough = false,
  toursCompleted: toursCompletedProp = {},
  autoStartWalkthrough = false,
  autoStartModuleTours = false,
}: {
  children: React.ReactNode;
  userId?: string | null;
  hasSeenWalkthrough?: boolean;
  toursCompleted?: Record<string, string>;
  /** Production Free first-run only — skipped in demo mode. */
  autoStartWalkthrough?: boolean;
  /** Production first-use module tours — skipped in demo so explore stays unblocked. */
  autoStartModuleTours?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const plan = usePlan();
  const planId = plan?.planId ?? null;

  const [namedTour, setNamedTour] = useState<NamedTourId>("product");
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [seen, setSeen] = useState(
    () => hasSeenWalkthrough || readLocalSeen(userId)
  );
  const [toursCompleted, setToursCompleted] = useState<Record<string, string>>(
    () => ({ ...toursCompletedProp, ...readLocalTours(userId) })
  );
  const autoStartedRef = useRef(false);
  const moduleAutoStartedRef = useRef<string | null>(null);

  const steps = useMemo(
    () => stepsForNamedTour(namedTour, planId),
    [namedTour, planId]
  );
  const step = steps[stepIndex] ?? steps[0];
  const totalSteps = steps.length;

  useEffect(() => {
    setSeen(hasSeenWalkthrough || readLocalSeen(userId));
  }, [hasSeenWalkthrough, userId]);

  useEffect(() => {
    setToursCompleted((current) => ({
      ...toursCompletedProp,
      ...readLocalTours(userId),
      ...current,
    }));
  }, [toursCompletedProp, userId]);

  const persistActive = useCallback(
    (value: boolean, index = stepIndex, tour: NamedTourId = namedTour) => {
      if (value) {
        sessionStorage.setItem(DEMO_TOUR_STORAGE_KEY, "1");
        sessionStorage.setItem(DEMO_TOUR_STEP_KEY, String(index));
        sessionStorage.setItem(DEMO_TOUR_NAME_KEY, tour);
      } else {
        sessionStorage.removeItem(DEMO_TOUR_STORAGE_KEY);
        sessionStorage.removeItem(DEMO_TOUR_STEP_KEY);
        sessionStorage.removeItem(DEMO_TOUR_NAME_KEY);
      }
    },
    [namedTour, stepIndex]
  );

  const navigateForStep = useCallback(
    (index: number, list: DemoTourStep[] = steps) => {
      const next = list[index];
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
    void persistPreferences({ hasSeenWalkthrough: true });
  }, [planId, userId]);

  const markModuleTourSeen = useCallback(
    (id: ModuleTourId) => {
      const at = new Date().toISOString();
      setToursCompleted((current) => {
        const next = { ...current, [id]: at };
        writeLocalTours(userId, next);
        void persistPreferences({ toursCompleted: { [id]: at } });
        return next;
      });
    },
    [userId]
  );

  const startNamed = useCallback(
    (tour: NamedTourId, fromStep = 0) => {
      const list = stepsForNamedTour(tour, planId);
      const clamped = Math.max(0, Math.min(fromStep, list.length - 1));
      setNamedTour(tour);
      setStepIndex(clamped);
      setActive(true);
      persistActive(true, clamped, tour);
      navigateForStep(clamped, list);
    },
    [navigateForStep, persistActive, planId]
  );

  const startTour = useCallback(
    (fromStep = 0) => {
      startNamed("product", fromStep);
    },
    [startNamed]
  );

  const startModuleTour = useCallback(
    (id: ModuleTourId) => {
      startNamed(id, 0);
    },
    [startNamed]
  );

  const endTour = useCallback(() => {
    const closing = namedTour;
    setActive(false);
    setPendingRoute(null);
    persistActive(false);
    if (closing === "product") markWalkthroughSeen();
    else markModuleTourSeen(closing);
  }, [markModuleTourSeen, markWalkthroughSeen, namedTour, persistActive]);

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
      const savedName = sessionStorage.getItem(DEMO_TOUR_NAME_KEY) ?? "product";
      const tour: NamedTourId =
        savedName === "product" || isModuleTourId(savedName) ? savedName : "product";
      const list = stepsForNamedTour(tour, planId);
      const saved = Number(sessionStorage.getItem(DEMO_TOUR_STEP_KEY) ?? "0");
      const clamped = Number.isFinite(saved)
        ? Math.max(0, Math.min(saved, list.length - 1))
        : 0;
      setNamedTour(tour);
      setStepIndex(clamped);
      setActive(true);
    }
  }, [planId]);

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
    if (!autoStartModuleTours) return;
    if (active) return;
    if (autoStartWalkthrough && !seen) return;
    const query =
      typeof window === "undefined" ? "" : window.location.search.replace(/^\?/, "");
    const moduleId = tourIdForPath(pathname, query);
    if (!moduleId) return;
    if (toursCompleted[moduleId]) return;
    if (sessionStorage.getItem(DEMO_TOUR_STORAGE_KEY) === "1") return;
    if (moduleAutoStartedRef.current === moduleId) return;

    moduleAutoStartedRef.current = moduleId;
    const timer = window.setTimeout(() => startModuleTour(moduleId), 1200);
    return () => window.clearTimeout(timer);
  }, [
    active,
    autoStartModuleTours,
    autoStartWalkthrough,
    pathname,
    seen,
    startModuleTour,
    toursCompleted,
  ]);

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
      namedTour,
      startTour,
      startModuleTour,
      endTour,
      nextStep,
      prevStep,
      goToStep,
    }),
    [
      active,
      endTour,
      goToStep,
      namedTour,
      nextStep,
      prevStep,
      startModuleTour,
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
