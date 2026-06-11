import Link from "next/link";
import { formatRelative } from "@/lib/utils";
import { getAgentDefinition, isAgentType } from "@/lib/workforce/agents";
import type { AgentRun } from "@/types/workforce";
import { Badge } from "@/components/ui/badge";

const statusTone: Record<AgentRun["status"], string> = {
  running: "bg-amber-950/60 text-amber-300 ring-amber-700/50",
  completed: "bg-emerald-950/60 text-emerald-300 ring-emerald-700/50",
  failed: "bg-red-950/60 text-red-300 ring-red-700/50",
};

export function RunList({ runs }: { runs: AgentRun[] }) {
  if (runs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[#A89878]">
        No agent runs yet. Run an AI agent to see results here.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[#3d3528] rounded-xl border border-[#3d3528] bg-[#101010]">
      {runs.map((run) => {
        if (!isAgentType(run.agentType)) return null;
        const agent = getAgentDefinition(run.agentType);
        const actions = run.actions ?? [];
        return (
          <li key={run.id}>
            <Link
              href={`/workforce/runs/${run.id}`}
              className="block px-4 py-3.5 transition-colors hover:bg-[#1a1714]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-[#F5E6C8]">{agent.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-[#A89878]">
                    {run.summary || run.inputSummary || "Running…"}
                  </p>
                </div>
                <Badge className={statusTone[run.status]}>{run.status}</Badge>
              </div>
              <p className="mt-2 text-[10px] text-[#A89878]/80">
                {formatRelative(run.createdAt)}
                {actions.length > 0 && ` · ${actions.length} action(s)`}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
