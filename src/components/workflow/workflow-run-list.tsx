import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { WorkflowRun } from "@/types/workflow";
import { formatRelative } from "@/lib/utils";

const statusColors: Record<WorkflowRun["status"], string> = {
  running: "bg-[#2A2210] text-[#C9AA72] ring-[#B8965D]/35",
  completed: "bg-[#0A2A33] text-[#4DA6FF] ring-[#4DA6FF]/30",
  failed: "bg-[#2A1218] text-[#F0A0A8] ring-[#8B3A45]/45",
  awaiting_approval: "bg-[#1A2B48]/60 text-[#C9AA72] ring-[#B8965D]/30",
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
