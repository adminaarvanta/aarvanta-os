"use client";

import { Loader2, Sparkles } from "lucide-react";
import type { SiteGenerationProgress, SiteGenerationStage } from "@/types/site-builder";
import { cn } from "@/lib/utils";

const SLIDES: Array<{
  stage: SiteGenerationStage;
  title: string;
  body: string;
}> = [
  {
    stage: "business",
    title: "Understanding your business",
    body: "Reading your brief and goals so every page feels on-brand.",
  },
  {
    stage: "brand",
    title: "Crafting your look",
    body: "Locking palette, fonts, and chrome from your chosen design.",
  },
  {
    stage: "pages",
    title: "Planning your pages",
    body: "Choosing the right structure for store, about, and contact.",
  },
  {
    stage: "layout",
    title: "Designing the layout",
    body: "Assembling sections that match the homepage direction you picked.",
  },
  {
    stage: "content",
    title: "Writing the words",
    body: "Turning your idea into headlines, offers, and calls to action.",
  },
  {
    stage: "media",
    title: "Choosing imagery",
    body: "Finding visuals that fit your category and mood.",
  },
  {
    stage: "done",
    title: "Almost ready",
    body: "Polishing the final preview — magic, almost done.",
  },
];

export function GenerationMagicSlides({
  progress,
  visible,
}: {
  progress: SiteGenerationProgress | null;
  visible: boolean;
}) {
  if (!visible) return null;

  const stage = progress?.stage ?? "business";
  const activeIdx = Math.max(
    0,
    SLIDES.findIndex((s) => s.stage === stage)
  );
  const slide = SLIDES[activeIdx] ?? SLIDES[0]!;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-lg px-6 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-gold">
          {stage === "done" ? (
            <Sparkles className="h-7 w-7" />
          ) : (
            <Loader2 className="h-7 w-7 animate-spin" />
          )}
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
          AI is designing
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
          {slide.title}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">{slide.body}</p>
        {progress?.message ? (
          <p className="mt-2 text-xs text-dim">{progress.message}</p>
        ) : null}

        <div className="mx-auto mt-8 h-1.5 max-w-xs overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-gold transition-all duration-700"
            style={{ width: `${Math.max(8, progress?.percent ?? 6)}%` }}
          />
        </div>

        <ul className="mx-auto mt-8 flex max-w-md flex-wrap justify-center gap-2">
          {SLIDES.filter((s) => s.stage !== "done").map((s, i) => {
            const done = i < activeIdx || stage === "done";
            const current = i === activeIdx && stage !== "done";
            return (
              <li
                key={s.stage}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-medium",
                  done && "bg-success/15 text-success",
                  current && "bg-gold/20 text-gold",
                  !done && !current && "bg-surface-muted text-dim"
                )}
              >
                {s.title.split(" ").slice(0, 2).join(" ")}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
