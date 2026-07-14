import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { WorkflowRun } from "@/types/workflow";
import { formatRelative } from "@/lib/utils";

const statusColors: Record<WorkflowRun["status"], string> = {
  running: "bg-gold/10 text-gold-bright ring-gold/35",
  completed: "bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/30",
  failed: "bg-danger/15 text-danger ring-danger/45",
  awaiting_approval: "bg-navy/60 text-gold-bright ring-gold/30",
};

export function WorkflowRunList({ runs }: { runs: WorkflowRun[] }) {
  if (!runs.length) {
    return <p className="text-sm text-muted">No runs yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {runs.map((run) => (
        <li key={run.id}>
          <Link
            href={`/workflows/runs/${run.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted px-4 py-3 hover:border-gold/40"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{run.workflowName}</p>
              <p className="text-[10px] text-muted">
                {formatRelative(run.createdAt)}
                {run.context.contactName ? ` · ${run.context.contactName}` : ""}
              </p>
            </div>
            <Badge className={statusColors[run.status]}>{run.status.replace("_", " ")}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
