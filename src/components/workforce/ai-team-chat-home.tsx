"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import {
  AI_TEAM_QUICK_ACTIONS,
  promptToGoalPayload,
  type GoalCreatePayload,
} from "@/lib/workforce/prompt-to-goal";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startJob(payload: GoalCreatePayload) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/workforce/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: { message?: string };
        execution?: WorkforceExecution;
      };
      if (!res.ok || !data.execution) {
        setError(data.error?.message ?? "Failed to start job");
        return;
      }
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
    await startJob(promptToGoalPayload(text));
  }

  async function onQuickAction(actionId: string) {
    const action = AI_TEAM_QUICK_ACTIONS.find((a) => a.id === actionId);
    if (!action || busy) return;
    setPrompt(action.prompt);
    await startJob({ ...action.payload });
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
          Describe an outcome or pick a quick action. We’ll start a job for you.
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
          aria-label="Start job"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>

      {error ? (
        <p className="text-center text-sm" style={{ color: "var(--wf-danger)" }}>
          {error}
        </p>
      ) : null}

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
