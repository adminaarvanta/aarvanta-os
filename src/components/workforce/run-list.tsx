import Link from "next/link";
import { formatRelative } from "@/lib/utils";
import { getAgentDefinition, isAgentType } from "@/lib/workforce/agents";
import type { AgentRun } from "@/types/workforce";
import { Badge } from "@/components/ui/badge";

const statusTone: Record<AgentRun["status"], string> = {
  running: "bg-gold/10 text-gold-bright ring-gold/35",
  completed: "bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/30",
  failed: "bg-danger/15 text-danger ring-danger/45",
};

export function RunList({ runs }: { runs: AgentRun[] }) {
  if (runs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No agent runs yet. Run an AI agent to see results here.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface-elevated">
      {runs.map((run) => {
        if (!isAgentType(run.agentType)) return null;
        const agent = getAgentDefinition(run.agentType);
        const actions = run.actions ?? [];
        return (
          <li key={run.id}>
            <Link
              href={`/workforce/runs/${run.id}`}
              className="block px-4 py-3.5 transition-colors hover:bg-surface-hover"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{agent.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                    {run.summary || run.inputSummary || "Running…"}
                  </p>
                </div>
                <Badge className={statusTone[run.status]}>{run.status}</Badge>
              </div>
              <p className="mt-2 text-[10px] text-muted/80">
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
