"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ASK_AI_SUGGESTIONS,
  type AiTeamModule,
} from "@/lib/ai-team/context-command";
import type { HumanPlan } from "@/lib/ai-team/plan";
import type { WorkforceExecution } from "@/types/workforce";
import { cn } from "@/lib/utils";

export function AskAiButton({
  module,
  entityType,
  entityId,
  entityLabel,
  suggestions,
  className,
}: {
  module: AiTeamModule;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  suggestions?: string[];
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<HumanPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chips = suggestions ?? ASK_AI_SUGGESTIONS[module];

  async function requestPlan(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/ai-team/context-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "plan",
          module,
          entityType,
          entityId,
          prompt: trimmed,
        }),
      });
      const data = (await res.json()) as {
        error?: { message?: string };
        plan?: HumanPlan;
      };
      if (!res.ok || !data.plan) {
        setError(data.error?.message ?? "Failed to build a plan");
        return;
      }
      setPlan(data.plan);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmPlan() {
    if (!plan || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-team/context-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          goalInput: plan.goalInput,
        }),
      });
      const data = (await res.json()) as {
        error?: { message?: string };
        execution?: WorkforceExecution;
      };
      if (!res.ok || !data.execution) {
        setError(data.error?.message ?? "Failed to start job");
        return;
      }
      setOpen(false);
      setPlan(null);
      setPrompt("");
      router.push(`/workforce/jobs/${data.execution.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="gap-1.5"
      >
        <Sparkles className="h-3.5 w-3.5 text-gold" />
        Ask AI
      </Button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-border bg-surface-elevated p-4 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Ask AI Team</p>
              <p className="text-xs text-muted">
                {entityLabel
                  ? `About ${entityLabel}`
                  : "Uses this page as context"}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              className="rounded-md p-1 text-muted hover:bg-surface-muted hover:text-foreground"
              onClick={() => {
                setOpen(false);
                setPlan(null);
                setError(null);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            className="mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              void requestPlan(prompt);
            }}
          >
            <textarea
              rows={2}
              value={prompt}
              disabled={busy}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Summarize this customer…"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            />
            <Button
              type="submit"
              size="sm"
              className="mt-2 w-full"
              disabled={busy || !prompt.trim()}
            >
              {busy && !plan ? "Planning…" : "Show plan"}
            </Button>
          </form>

          {!plan ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPrompt(chip);
                    void requestPlan(chip);
                  }}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-gold disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>
          ) : null}

          {error ? (
            <p className="mt-2 text-xs text-[color:var(--danger)]">{error}</p>
          ) : null}

          {plan ? (
            <div className="mt-3 space-y-2 rounded-lg border border-border bg-surface-muted/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Here’s what I’ll do
              </p>
              <p className="text-sm font-semibold text-foreground">{plan.title}</p>
              <p className="text-xs text-muted">{plan.summary}</p>
              <p className="text-xs text-muted">
                {plan.specialists.join(", ")} · {plan.estimatedMinutes.min}–
                {plan.estimatedMinutes.max} min
              </p>
              <ol className="space-y-1 text-xs text-foreground">
                {plan.steps.slice(0, 4).map((step, i) => (
                  <li key={`${step.title}-${i}`}>
                    {i + 1}. {step.title}
                  </li>
                ))}
                {plan.steps.length > 4 ? (
                  <li className="text-muted">
                    +{plan.steps.length - 4} more steps
                  </li>
                ) : null}
              </ol>
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => void confirmPlan()}
                >
                  {busy ? "Starting…" : "Continue"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setPlan(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
