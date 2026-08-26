"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApproveWorkflowButton } from "@/components/workflow/approve-workflow-button";
import {
  FlowChip,
  FlowHeader,
  FlowPanel,
} from "@/components/workflow/workflow-shell";
import { formatRelative } from "@/lib/utils";
import type { WorkflowRun } from "@/types/workflow";

const statusTone: Record<
  WorkflowRun["status"],
  "wait" | "ok" | "danger" | "amber"
> = {
  running: "wait",
  completed: "ok",
  failed: "danger",
  awaiting_approval: "amber",
};

function logChip(status: string): { tone: "ok" | "danger" | "wait" | "muted"; label: string } {
  if (status === "completed" || status === "success") return { tone: "ok", label: "Done" };
  if (status === "failed" || status === "error") return { tone: "danger", label: "Couldn’t" };
  if (status === "awaiting_approval" || status === "skipped") {
    return { tone: "wait", label: status === "skipped" ? "Skipped" : "Needs you" };
  }
  return { tone: "muted", label: status };
}

export function WorkflowRunView({ runId }: { runId: string }) {
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/workflows/runs/${runId}`)
      .then(async (res) => {
        const data = (await res.json()) as { run?: WorkflowRun; error?: string };
        if (!res.ok || !data.run) {
          throw new Error(typeof data.error === "string" ? data.error : "Not found");
        }
        if (!cancelled) setRun(data.run);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn’t load this");
      });
    return () => {
      cancelled = true;
    };
  }, [runId]);

  if (error) {
    return (
      <div className="px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/automation?view=runs"
            className="text-xs font-medium hover:underline"
            style={{ color: "var(--flow-accent)" }}
          >
            ← History
          </Link>
          <p className="mt-4 text-sm" style={{ color: "var(--flow-danger)" }}>
            We couldn’t find that activity.
          </p>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <p className="px-5 py-8 text-sm sm:px-8" style={{ color: "var(--flow-muted)" }}>
        Loading…
      </p>
    );
  }

  const statusLabel =
    run.status === "completed"
      ? "Done"
      : run.status === "failed"
        ? "Couldn’t finish"
        : run.status === "awaiting_approval"
          ? "Needs you"
          : "Working";

  return (
    <>
      <FlowHeader
        title={run.workflowName}
        subtitle={
          <div className="space-y-1.5">
            <Link
              href="/automation"
              className="text-xs font-medium hover:underline"
              style={{ color: "var(--flow-accent)" }}
            >
              ← All automations
            </Link>
            <p>
              {run.context.contactName ? `For ${run.context.contactName} · ` : ""}
              {formatRelative(run.createdAt)}
            </p>
          </div>
        }
        actions={<FlowChip tone={statusTone[run.status]}>{statusLabel}</FlowChip>}
      />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <ApproveWorkflowButton run={run} />

          {run.error ? (
            <FlowPanel
              style={{
                background: "var(--flow-danger-soft)",
                borderColor: "#FCA5A5",
              }}
            >
              <p className="text-sm" style={{ color: "var(--flow-danger)" }}>
                {run.error}
              </p>
            </FlowPanel>
          ) : null}

          {run.context.contactName ||
          run.context.leadScore !== undefined ||
          run.context.dealValue !== undefined ? (
            <FlowPanel>
              <h3 className="text-sm font-semibold" style={{ color: "var(--flow-ink)" }}>
                For
              </h3>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {run.context.contactName ? (
                  <>
                    <dt style={{ color: "var(--flow-muted)" }}>Person</dt>
                    <dd style={{ color: "var(--flow-ink)" }}>{run.context.contactName}</dd>
                  </>
                ) : null}
                {run.context.leadScore !== undefined ? (
                  <>
                    <dt style={{ color: "var(--flow-muted)" }}>Interest</dt>
                    <dd style={{ color: "var(--flow-ink)" }}>{run.context.leadScore}</dd>
                  </>
                ) : null}
                {run.context.dealValue !== undefined ? (
                  <>
                    <dt style={{ color: "var(--flow-muted)" }}>Deal</dt>
                    <dd style={{ color: "var(--flow-ink)" }}>
                      £{run.context.dealValue.toLocaleString()}
                    </dd>
                  </>
                ) : null}
              </dl>
            </FlowPanel>
          ) : null}

          <FlowPanel>
            <h3 className="text-sm font-semibold" style={{ color: "var(--flow-ink)" }}>
              What we did
            </h3>
            <ul className="mt-4 space-y-3">
              {run.stepLogs.map((log) => {
                const chip = logChip(log.status);
                return (
                  <li
                    key={`${log.stepId}-${log.at}`}
                    className="rounded-xl border p-3"
                    style={{ borderColor: "var(--flow-line)", background: "#F8F9FC" }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: "var(--flow-ink)" }}>
                        {log.stepLabel}
                      </p>
                      <FlowChip tone={chip.tone}>{chip.label}</FlowChip>
                    </div>
                    {log.output ? (
                      <p
                        className="mt-2 text-xs whitespace-pre-wrap"
                        style={{ color: "var(--flow-muted)" }}
                      >
                        {log.output}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </FlowPanel>
        </div>
      </div>
    </>
  );
}
