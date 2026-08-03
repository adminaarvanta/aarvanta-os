"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import {
  WfPrimaryButton,
  WfSecondaryButton,
} from "@/components/workforce/workforce-shell";
import { AI_TEAM_QUICK_ACTIONS } from "@/lib/workforce/prompt-to-goal";
import type { HumanPlan } from "@/lib/ai-team/plan";
import type { WorkforceExecution } from "@/types/workforce";

export type ActivityStripCounts = {
  pendingApprovals: number;
  activeJobs: number;
  completedToday: number;
};

export function AiTeamChatHome({
  counts,
}: {
  counts: ActivityStripCounts;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<HumanPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestPlan(text: string) {
    setBusy(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/workforce/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "plan", prompt: text }),
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
      const res = await fetch("/api/workforce/command", {
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
      setPlan(null);
      router.push(`/workforce/jobs/${data.execution.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (!text || busy) return;
    await requestPlan(text);
  }

  async function onQuickAction(actionId: string) {
    const action = AI_TEAM_QUICK_ACTIONS.find((a) => a.id === actionId);
    if (!action || busy) return;
    setPrompt(action.prompt);
    await requestPlan(action.prompt);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-1 py-4">
      <div className="text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: "var(--wf-accent-soft)" }}
        >
          <Sparkles className="h-6 w-6" style={{ color: "var(--wf-accent)" }} />
        </div>
        <h2
          className="text-2xl font-bold tracking-tight sm:text-3xl"
          style={{ color: "var(--wf-ink)" }}
        >
          What should your AI Team do?
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--wf-muted)" }}>
          Describe an outcome — we’ll show a plan before starting a job.
        </p>
      </div>

      <form onSubmit={onSubmit} className="relative">
        <label htmlFor="ai-team-prompt" className="sr-only">
          Ask anything
        </label>
        <textarea
          id="ai-team-prompt"
          rows={3}
          value={prompt}
          disabled={busy}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask anything…"
          className="w-full resize-none rounded-2xl border bg-white px-4 py-3.5 pr-14 text-sm shadow-[0_1px_3px_rgba(14,21,37,0.04)] outline-none focus:border-[var(--wf-accent)]"
          style={{ borderColor: "var(--wf-line)", color: "var(--wf-ink)" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void onSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={busy || !prompt.trim()}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-40"
          style={{ background: "var(--wf-accent)" }}
          aria-label="Build plan"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>

      {error ? (
        <p className="text-center text-sm" style={{ color: "var(--wf-danger)" }}>
          {error}
        </p>
      ) : null}

      {plan ? (
        <div
          className="rounded-2xl border bg-white p-5 shadow-[0_1px_3px_rgba(14,21,37,0.04)]"
          style={{ borderColor: "var(--wf-line)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--wf-muted)" }}
          >
            Here’s what I’ll do
          </p>
          <h3
            className="mt-1 text-lg font-bold"
            style={{ color: "var(--wf-ink)" }}
          >
            {plan.title}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--wf-muted)" }}>
            {plan.summary}
          </p>

          <p
            className="mt-4 text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--wf-muted)" }}
          >
            Specialists
          </p>
          <p className="mt-1 text-sm font-medium" style={{ color: "var(--wf-ink)" }}>
            {plan.specialists.join(", ")}
            <span className="font-normal" style={{ color: "var(--wf-muted)" }}>
              {" "}
              · {plan.estimatedMinutes.min}–{plan.estimatedMinutes.max} min
            </span>
          </p>

          <ol className="mt-4 space-y-2">
            {plan.steps.map((step, i) => (
              <li
                key={`${step.title}-${i}`}
                className="flex gap-3 text-sm"
                style={{ color: "var(--wf-ink)" }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{
                    background: "var(--wf-accent-soft)",
                    color: "var(--wf-accent)",
                  }}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="font-medium">{step.title}</span>
                  <span
                    className="mt-0.5 block text-xs"
                    style={{ color: "var(--wf-muted)" }}
                  >
                    {step.agentLabel}
                    {step.requiresApproval ? " · needs your approval" : ""}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          {plan.needsApproval ? (
            <p
              className="mt-4 rounded-xl px-3 py-2 text-xs"
              style={{
                background: "var(--wf-wait-soft)",
                color: "#B45309",
              }}
            >
              Some steps may pause under Waiting for You before they finish.
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <WfPrimaryButton
              type="button"
              disabled={busy}
              onClick={() => void confirmPlan()}
            >
              {busy ? "Starting…" : "Continue"}
            </WfPrimaryButton>
            <WfSecondaryButton
              type="button"
              disabled={busy}
              onClick={() => setPlan(null)}
            >
              Cancel
            </WfSecondaryButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {AI_TEAM_QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={busy}
              onClick={() => void onQuickAction(action.id)}
              className="rounded-full border bg-white px-3.5 py-1.5 text-xs font-semibold transition hover:border-[var(--wf-accent)] disabled:opacity-50"
              style={{ borderColor: "var(--wf-line)", color: "var(--wf-ink)" }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div
        className="grid grid-cols-3 gap-3 rounded-2xl border bg-white p-4 text-center shadow-[0_1px_3px_rgba(14,21,37,0.04)]"
        style={{ borderColor: "var(--wf-line)" }}
      >
        <div>
          <p className="text-lg font-bold" style={{ color: "var(--wf-ink)" }}>
            {counts.pendingApprovals}
          </p>
          <p className="text-[11px] font-medium" style={{ color: "var(--wf-muted)" }}>
            Waiting for you
          </p>
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: "var(--wf-ink)" }}>
            {counts.activeJobs}
          </p>
          <p className="text-[11px] font-medium" style={{ color: "var(--wf-muted)" }}>
            Active jobs
          </p>
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: "var(--wf-ink)" }}>
            {counts.completedToday}
          </p>
          <p className="text-[11px] font-medium" style={{ color: "var(--wf-muted)" }}>
            Done today
          </p>
        </div>
      </div>
    </div>
  );
}
