"use client";

import {
  Check,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { GenerationMagicSlides } from "@/components/build/generation-magic-slides";
import { GeneratedSitePreview } from "@/components/build/generated-site-preview";
import { Button } from "@/components/ui/button";
import type {
  GeneratedSite,
  SiteGenerationProgress,
  SiteGenerationStage,
  SiteRefineTurn,
} from "@/types/site-builder";
import { cn } from "@/lib/utils";

const STAGES: Array<{ id: SiteGenerationStage; label: string }> = [
  { id: "business", label: "Analyzing business" },
  { id: "brand", label: "Creating brand & style" },
  { id: "pages", label: "Planning pages" },
  { id: "layout", label: "Designing layout" },
  { id: "content", label: "Writing content" },
  { id: "media", label: "Generating images" },
  { id: "done", label: "Finishing up" },
];

function stageStatus(
  stageId: SiteGenerationStage,
  progress: SiteGenerationProgress | null,
  done: boolean
): "completed" | "in_progress" | "pending" {
  if (done || progress?.stage === "done") {
    return "completed";
  }
  if (!progress) return stageId === "business" ? "in_progress" : "pending";
  const order = STAGES.map((s) => s.id);
  const current = order.indexOf(progress.stage);
  const self = order.indexOf(stageId);
  if (self < current) return "completed";
  if (self === current) return "in_progress";
  return "pending";
}

export function BuildStudioLayout({
  site,
  progress,
  busy,
  businessSummary,
  pageCount,
  sectionCount,
  refineInput,
  onRefineInput,
  onRefine,
  refineChat = [],
  onConnectDomain,
  onPublish,
  onInviteHint,
  siteName,
  domainLabel,
  featureCount = 0,
  statusMessage,
  rightTab: controlledRightTab,
  onRightTabChange,
}: {
  site?: GeneratedSite | null;
  progress: SiteGenerationProgress | null;
  busy: boolean;
  businessSummary?: string;
  pageCount: number;
  sectionCount: number;
  refineInput: string;
  onRefineInput: (v: string) => void;
  onRefine: () => void;
  refineChat?: SiteRefineTurn[];
  onConnectDomain?: () => void;
  onPublish?: () => void;
  onInviteHint?: () => void;
  siteName: string;
  domainLabel?: string;
  featureCount?: number;
  statusMessage?: string | null;
  rightTab?: "assistant" | "website";
  onRightTabChange?: (tab: "assistant" | "website") => void;
}) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [internalRightTab, setInternalRightTab] = useState<"assistant" | "website">(
    "assistant"
  );
  const rightTab = controlledRightTab ?? internalRightTab;
  const setRightTab = onRightTabChange ?? setInternalRightTab;
  const done = Boolean(site) && !busy;
  const showMagic = busy && !site;
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [refineChat?.length, refineInput, statusMessage, busy]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <GenerationMagicSlides progress={progress} visible={showMagic} />
      <section className="flex max-h-[38vh] w-full shrink-0 flex-col border-b border-border bg-surface-elevated lg:max-h-none lg:w-[280px] lg:border-b-0 lg:border-r">
        <div className="border-b border-border-subtle px-5 py-5">
          <h2 className="text-lg font-semibold leading-snug text-foreground">
            {done
              ? "Your website is ready"
              : "We’re building your website with the power of AI."}
          </h2>
          {businessSummary ? (
            <p className="mt-2 line-clamp-3 text-xs text-muted">{businessSummary}</p>
          ) : null}
        </div>
        <ul className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {STAGES.map((s) => {
            const status = stageStatus(s.id, progress, done);
            return (
              <li
                key={s.id}
                className="rounded-xl border border-border bg-surface px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{s.label}</p>
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-wide",
                      status === "completed" && "text-success",
                      status === "in_progress" && "text-gold",
                      status === "pending" && "text-dim"
                    )}
                  >
                    {status === "completed"
                      ? "Completed"
                      : status === "in_progress"
                        ? `In progress${progress ? ` (${progress.percent}%)` : ""}`
                        : "Pending"}
                  </span>
                </div>
                {status === "in_progress" ? (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-gold transition-all duration-500"
                      style={{ width: `${Math.max(8, progress?.percent ?? 10)}%` }}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        <div className="border-t border-border-subtle px-4 py-3">
          <button
            type="button"
            onClick={() => setRightTab("assistant")}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-xs text-muted hover:border-gold/40 hover:text-foreground"
          >
            Ask our AI Assistant →
          </button>
        </div>
      </section>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
            {(
              [
                ["desktop", Monitor],
                ["tablet", Tablet],
                ["mobile", Smartphone],
              ] as const
            ).map(([id, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setDevice(id)}
                className={cn(
                  "rounded-md p-1.5 transition",
                  device === id ? "bg-gold/20 text-gold" : "text-muted hover:text-foreground"
                )}
                aria-label={id}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <p className="max-w-[min(100%,280px)] truncate rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            {domainLabel
              ? `https://${domainLabel}`
              : `https://${siteName.toLowerCase().replace(/\s+/g, "") || "site"}.sites.aarvanta.cloud`}
          </p>
          <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-medium text-dim">
            Preview
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-5">
          {site ? (
            <div
              className={cn(
                "mx-auto min-w-0 overflow-hidden rounded-xl border border-border shadow-lg transition-all",
                device === "desktop" && "w-full max-w-5xl",
                device === "tablet" && "w-full max-w-[768px]",
                device === "mobile" && "w-full max-w-[390px]"
              )}
            >
              <GeneratedSitePreview key={site.generatedAt} site={site} />
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
              <p className="mt-4 text-sm text-foreground">
                {progress?.message ?? "Building your website…"}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="flex max-h-[42vh] w-full shrink-0 flex-col border-t border-border bg-surface-elevated lg:max-h-none lg:w-[320px] lg:border-l lg:border-t-0">
        <div className="flex border-b border-border-subtle">
          {(
            [
              ["assistant", "AI Assistant"],
              ["website", "Your Website"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRightTab(id)}
              className={cn(
                "flex-1 px-3 py-3 text-xs font-semibold uppercase tracking-wide",
                rightTab === id
                  ? "border-b-2 border-gold text-gold"
                  : "text-dim hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {rightTab === "assistant" ? (
          <div className="flex min-h-0 flex-1 flex-col p-4">
            <div className="flex-1 space-y-3 overflow-y-auto text-sm">
              <div className="rounded-xl bg-surface-muted px-3 py-2 text-muted">
                Try “make the theme green”, “use blue buttons”, or “change the headline to …”.
                Your prompts are saved with this site.
              </div>
              {refineChat.map((turn) =>
                turn.role === "user" ? (
                  <div
                    key={turn.id}
                    className="ml-6 rounded-xl bg-gold/15 px-3 py-2 text-foreground"
                  >
                    <p>{turn.content}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-dim">
                      {turn.status === "pending"
                        ? "Applying…"
                        : turn.status === "failed"
                          ? "Failed"
                          : "Saved"}
                      {turn.createdAt
                        ? ` · ${new Date(turn.createdAt).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                ) : (
                  <div
                    key={turn.id}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs",
                      turn.status === "failed"
                        ? "border-danger/30 bg-danger/10 text-danger"
                        : "border-success/30 bg-success/10 text-success"
                    )}
                  >
                    {turn.content}
                  </div>
                )
              )}
              {refineInput.trim() &&
              !refineChat.some(
                (t) =>
                  t.role === "user" &&
                  t.status === "pending" &&
                  t.content === refineInput.trim()
              ) ? (
                <div className="ml-6 rounded-xl border border-dashed border-gold/40 bg-gold/5 px-3 py-2 text-foreground">
                  {refineInput}
                </div>
              ) : null}
              {statusMessage && !refineChat.some((t) => t.content === statusMessage) ? (
                <div className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
                  {statusMessage}
                </div>
              ) : null}
              {done && refineChat.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted">
                  Ask for theme, headline, or CTA changes — each request stays in this history.
                </div>
              ) : null}
              <div ref={chatEndRef} />
            </div>
            <textarea
              value={refineInput}
              onChange={(e) => onRefineInput(e.target.value)}
              rows={3}
              placeholder="Describe a change…"
              className="mt-3 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-foreground placeholder:text-dim"
            />
            <Button
              type="button"
              className="mt-2 w-full"
              disabled={busy || !refineInput.trim() || !site}
              onClick={onRefine}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Apply with AI"
              )}
            </Button>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Pages", String(pageCount)],
                ["Sections", String(sectionCount)],
                ["Theme", site?.brand?.style ?? "Custom"],
                ["Apps", String(featureCount || Math.max(1, Math.round(sectionCount / 8)))],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-border bg-surface px-3 py-2.5"
                >
                  <p className="text-[10px] uppercase tracking-wide text-dim">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-dim">
                Next steps
              </p>
              <ul className="mt-2 space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={onConnectDomain}
                    className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm text-foreground hover:border-gold/40"
                  >
                    <Check className="h-3.5 w-3.5 text-gold" />
                    Connect Domain
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onPublish}
                    className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm text-foreground hover:border-gold/40"
                  >
                    <Check className="h-3.5 w-3.5 text-gold" />
                    Publish Website
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onInviteHint}
                    className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm text-foreground hover:border-gold/40"
                  >
                    <Check className="h-3.5 w-3.5 text-gold" />
                    Invite Team Members
                  </button>
                </li>
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
