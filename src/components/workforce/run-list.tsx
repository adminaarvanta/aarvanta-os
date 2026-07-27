import Link from "next/link";
import { formatRelative } from "@/lib/utils";
import { getAgentDefinition, isAgentType } from "@/lib/workforce/agents";
import type { AgentRun } from "@/types/workforce";

export function RunList({ runs }: { runs: AgentRun[] }) {
  if (runs.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm" style={{ color: "var(--wf-muted)" }}>
        No agent runs yet. Run this AI employee to see results here.
      </p>
    );
  }

  return (
    <ul className="divide-y" style={{ borderColor: "var(--wf-line)" }}>
      {runs.map((run) => {
        if (!isAgentType(run.agentType)) return null;
        const agent = getAgentDefinition(run.agentType);
        const actions = run.actions ?? [];
        const tone =
          run.status === "completed"
            ? { bg: "var(--wf-ok-soft)", color: "var(--wf-ok)" }
            : run.status === "failed"
              ? { bg: "var(--wf-danger-soft)", color: "var(--wf-danger)" }
              : { bg: "var(--wf-accent-soft)", color: "var(--wf-accent)" };
        return (
          <li key={run.id}>
            <Link
              href={`/workforce/runs/${run.id}`}
              className="block px-5 py-4 transition hover:bg-[#F8F9FC]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className="font-semibold"
                    style={{ color: "var(--wf-ink)" }}
                  >
                    {agent.name}
                  </p>
                  <p
                    className="mt-0.5 line-clamp-2 text-xs"
                    style={{ color: "var(--wf-muted)" }}
                  >
                    {run.summary || run.inputSummary || "Running…"}
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase"
                  style={{ background: tone.bg, color: tone.color }}
                >
                  {run.status}
                </span>
              </div>
              <p className="mt-2 text-[10px]" style={{ color: "var(--wf-muted)" }}>
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
