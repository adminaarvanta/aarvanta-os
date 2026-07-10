import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { WorkflowRun } from "@/types/workflow";
import { formatRelative } from "@/lib/utils";

const statusColors: Record<WorkflowRun["status"], string> = {
  running: "bg-amber-950/60 text-amber-300 ring-amber-700/50",
  completed: "bg-emerald-950/60 text-emerald-300 ring-emerald-700/50",
  failed: "bg-red-950/60 text-red-300 ring-red-700/50",
  awaiting_approval: "bg-violet-950/60 text-violet-300 ring-violet-700/50",
};

export function WorkflowRunList({ runs }: { runs: WorkflowRun[] }) {
  if (!runs.length) {
    return <p className="text-sm text-[#9AABC4]">No runs yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {runs.map((run) => (
        <li key={run.id}>
          <Link
            href={`/workflows/runs/${run.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#243656] bg-[#121E32] px-4 py-3 hover:border-[#B8965D]/40"
          >
            <div>
              <p className="text-sm font-medium text-[#FFFFFF]">{run.workflowName}</p>
              <p className="text-[10px] text-[#9AABC4]">
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
