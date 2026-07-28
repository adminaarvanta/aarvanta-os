import Link from "next/link";
import { notFound } from "next/navigation";
import { ApproveWorkflowButton } from "@/components/workflow/approve-workflow-button";
import { WorkflowNav } from "@/components/workflow/workflow-nav";
import {
  FlowChip,
  FlowHeader,
  FlowPanel,
} from "@/components/workflow/workflow-shell";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { getTenantScope } from "@/lib/tenant/context";
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

const logTone = (status: string): "ok" | "danger" | "wait" | "muted" => {
  if (status === "completed" || status === "success") return "ok";
  if (status === "failed" || status === "error") return "danger";
  if (status === "awaiting_approval" || status === "skipped") return "wait";
  return "muted";
};

export default async function WorkflowRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scope = await getTenantScope();
  const run = await getWorkflowRepository().getRun(id, scope);
  if (!run) notFound();

  return (
    <>
      <FlowHeader
        title="Workflow run"
        subtitle={
          <div className="space-y-1.5">
            <Link
              href={`/workflows/${run.workflowId}`}
              className="text-xs font-medium hover:underline"
              style={{ color: "var(--flow-accent)" }}
            >
              ← {run.workflowName}
            </Link>
            <p>
              {formatRelative(run.createdAt)}
              {run.context.contactName ? ` · ${run.context.contactName}` : ""}
            </p>
          </div>
        }
        actions={
          <FlowChip tone={statusTone[run.status]}>
            {run.status.replace("_", " ")}
          </FlowChip>
        }
      />
      <WorkflowNav />
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
              <p
                className="text-sm"
                style={{ color: "var(--flow-danger)" }}
              >
                {run.error}
              </p>
            </FlowPanel>
          ) : null}

          <FlowPanel>
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--flow-ink)" }}
            >
              Context
            </h3>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {run.context.contactName ? (
                <>
                  <dt style={{ color: "var(--flow-muted)" }}>Contact</dt>
                  <dd style={{ color: "var(--flow-ink)" }}>
                    {run.context.contactName}
                  </dd>
                </>
              ) : null}
              {run.context.leadScore !== undefined ? (
                <>
                  <dt style={{ color: "var(--flow-muted)" }}>Lead score</dt>
                  <dd style={{ color: "var(--flow-ink)" }}>
                    {run.context.leadScore}
                  </dd>
                </>
              ) : null}
              {run.context.dealValue !== undefined ? (
                <>
                  <dt style={{ color: "var(--flow-muted)" }}>Deal value</dt>
                  <dd style={{ color: "var(--flow-ink)" }}>
                    £{run.context.dealValue.toLocaleString()}
                  </dd>
                </>
              ) : null}
            </dl>
          </FlowPanel>

          <FlowPanel>
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--flow-ink)" }}
            >
              Step log
            </h3>
            <ul className="mt-4 space-y-3">
              {run.stepLogs.map((log) => (
                <li
                  key={`${log.stepId}-${log.at}`}
                  className="rounded-xl border p-3"
                  style={{ borderColor: "var(--flow-line)", background: "#F8F9FC" }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--flow-ink)" }}
                    >
                      {log.stepLabel}
                    </p>
                    <FlowChip tone="muted">{log.stepType}</FlowChip>
                    <FlowChip tone={logTone(log.status)}>{log.status}</FlowChip>
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
              ))}
            </ul>
          </FlowPanel>
        </div>
      </div>
    </>
  );
}

export const metadata = { title: "Workflow run" };
