"use client";

import { useEffect, useState } from "react";
import { FlowPanel } from "@/components/workflow/workflow-shell";
import { WorkflowRunList } from "@/components/workflow/workflow-run-list";
import type { WorkflowRun } from "@/types/workflow";

export function AutomationHistory() {
  const [runs, setRuns] = useState<WorkflowRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/workflows/runs")
      .then(async (res) => {
        const data = (await res.json()) as { runs?: WorkflowRun[]; error?: string };
        if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Couldn’t load history");
        if (!cancelled) setRuns(data.runs ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn’t load history");
          setRuns([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FlowPanel className="overflow-hidden !p-0">
      <div className="h-1.5 bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-500" />
      <div
        className="border-b bg-gradient-to-r from-violet-500/[0.08] via-transparent to-cyan-500/[0.08] px-5 py-4"
        style={{ borderColor: "var(--flow-line)" }}
      >
        <h3 className="text-sm font-semibold" style={{ color: "var(--flow-ink)" }}>
          What already happened
        </h3>
        <p className="mt-0.5 text-xs" style={{ color: "var(--flow-muted)" }}>
          Emails sent, calls booked, tasks created.
        </p>
      </div>
      {error ? (
        <p className="px-5 py-4 text-sm" style={{ color: "var(--flow-danger)" }}>
          {error}
        </p>
      ) : runs === null ? (
        <p className="px-5 py-4 text-sm" style={{ color: "var(--flow-muted)" }}>
          Loading…
        </p>
      ) : (
        <WorkflowRunList runs={runs} />
      )}
    </FlowPanel>
  );
}
