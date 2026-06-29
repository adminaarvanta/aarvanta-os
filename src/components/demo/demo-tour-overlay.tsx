"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoTourOptional } from "@/components/demo/demo-tour-provider";
import type { DemoTourPlacement } from "@/lib/demo/tour-steps";

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const PADDING = 10;

function measureTarget(selector?: string): Rect | null {
  if (!selector || typeof document === "undefined") return null;
  const selectors = selector.split(",").map((part) => part.trim());
  for (const part of selectors) {
    const element = document.querySelector(part);
    if (!element) continue;
    const box = element.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) continue;
    if (box.bottom < 0 || box.top > window.innerHeight) continue;
    return {
      top: box.top - PADDING,
      left: box.left - PADDING,
      width: box.width + PADDING * 2,
      height: box.height + PADDING * 2,
    };
  }
  return null;
}

function tooltipPosition(
  rect: Rect | null,
  placement: DemoTourPlacement
): React.CSSProperties {
  if (!rect || placement === "center") {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      maxWidth: "min(28rem, calc(100vw - 2rem))",
    };
  }

  const margin = 16;
  const cardWidth = 320;

  switch (placement) {
    case "right":
      return {
        top: rect.top + rect.height / 2,
        left: Math.min(rect.left + rect.width + margin, window.innerWidth - cardWidth - 16),
        transform: "translateY(-50%)",
        maxWidth: cardWidth,
      };
    case "left":
      return {
        top: rect.top + rect.height / 2,
        left: Math.max(16, rect.left - cardWidth - margin),
        transform: "translateY(-50%)",
        maxWidth: cardWidth,
      };
    case "top":
      return {
        top: Math.max(16, rect.top - margin),
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, -100%)",
        maxWidth: cardWidth,
      };
    case "bottom":
    default:
      return {
        top: rect.top + rect.height + margin,
        left: Math.min(
          Math.max(16, rect.left + rect.width / 2 - cardWidth / 2),
          window.innerWidth - cardWidth - 16
        ),
        maxWidth: cardWidth,
      };
  }
}

export function DemoTourOverlay() {
  const tour = useDemoTourOptional();
  const [rect, setRect] = useState<Rect | null>(null);

  const updateRect = useCallback(() => {
    if (!tour?.active) return;
    const placement = tour.step.placement ?? "center";
    if (placement === "center" || !tour.step.target) {
      setRect(null);
      return;
    }
    setRect(measureTarget(tour.step.target));
  }, [tour?.active, tour?.step.placement, tour?.step.target]);

  useLayoutEffect(() => {
    updateRect();
  }, [updateRect, tour?.stepIndex, tour?.active]);

  useEffect(() => {
    if (!tour?.active) return;

    updateRect();
    const needsLayout = tour.step.expandSidebar || tour.step.openAllTools;
    const timer = window.setTimeout(updateRect, needsLayout ? 500 : 450);
    const timer2 = needsLayout
      ? window.setTimeout(updateRect, 750)
      : undefined;

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.clearTimeout(timer);
      if (timer2 !== undefined) window.clearTimeout(timer2);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [
    tour?.active,
    tour?.stepIndex,
    tour?.step.expandSidebar,
    tour?.step.openAllTools,
    updateRect,
  ]);

  if (!tour?.active) return null;

  const { step, stepIndex, totalSteps, nextStep, prevStep, endTour } = tour;
  const placement =
    !rect && step.target && (step.placement ?? "bottom") !== "center"
      ? "center"
      : step.placement ?? (step.target ? "bottom" : "center");
  const isLast = stepIndex >= totalSteps - 1;
  const isFirst = stepIndex === 0;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-auto" role="dialog" aria-modal="true">
      {rect ? (
        <>
          <div
            className="pointer-events-none fixed rounded-xl ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-transparent transition-all duration-300 ease-out"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.72)",
            }}
          />
          <div className="fixed inset-0 bg-black/10 pointer-events-none" aria-hidden />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/75" aria-hidden />
      )}

      <div
        className="fixed z-[201] rounded-xl border border-[#3d3528] bg-[#101010] p-5 shadow-2xl shadow-black/50"
        style={tooltipPosition(rect, placement)}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#D4AF37]">
              Step {stepIndex + 1} of {totalSteps}
            </p>
            <h3 className="mt-1 text-base font-semibold text-[#F5E6C8]">{step.title}</h3>
          </div>
          <button
            type="button"
            onClick={endTour}
            className="rounded-lg p-1 text-[#A89878] hover:bg-[#1a1714] hover:text-[#F5E6C8]"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-[#A89878]">{step.description}</p>
        {step.tip && (
          <p className="mt-3 rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-2 text-xs text-[#D4AF37]">
            {step.tip}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={endTour}
            className="text-xs text-[#A89878] hover:text-[#F5E6C8] hover:underline"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={prevStep}
              disabled={isFirst}
              className="text-[#F5E6C8]"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={nextStep}
              className="bg-[#D4AF37] text-black hover:bg-[#F9E076]"
            >
              {isLast ? "Finish" : "Next"}
              {!isLast && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <span
              key={index}
              className={
                index === stepIndex
                  ? "h-1.5 w-4 rounded-full bg-[#D4AF37]"
                  : "h-1.5 w-1.5 rounded-full bg-[#3d3528]"
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
