import Link from "next/link";
import { FlowChip } from "@/components/workflow/workflow-shell";
import type { WorkflowRun } from "@/types/workflow";
import { formatRelative } from "@/lib/utils";

const statusTone: Record<
  WorkflowRun["status"],
  "wait" | "ok" | "danger" | "amber"
> = {
  running: "wait",
  completed: "ok",
  failed: "danger",
  awaiting_approval: "amber",
};

export function WorkflowRunList({ runs }: { runs: WorkflowRun[] }) {
  if (!runs.length) {
    return (
      <p className="px-3 py-4 text-sm" style={{ color: "var(--flow-muted)" }}>
        No runs yet.
      </p>
    );
  }

  return (
    <ul className="divide-y" style={{ borderColor: "var(--flow-line)" }}>
      {runs.map((run) => (
        <li key={run.id} style={{ borderColor: "var(--flow-line)" }}>
          <Link
            href={`/workflows/runs/${run.id}`}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 transition hover:bg-[#F8F9FC]"
          >
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--flow-ink)" }}
              >
                {run.workflowName}
              </p>
              <p className="text-[10px]" style={{ color: "var(--flow-muted)" }}>
                {formatRelative(run.createdAt)}
                {run.context.contactName ? ` · ${run.context.contactName}` : ""}
              </p>
            </div>
            <FlowChip tone={statusTone[run.status]}>
              {run.status.replace("_", " ")}
            </FlowChip>
          </Link>
        </li>
      ))}
    </ul>
  );
}
