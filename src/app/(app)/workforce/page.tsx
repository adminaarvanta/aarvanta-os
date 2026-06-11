import { Sparkles } from "lucide-react";
import { AgentCard } from "@/components/workforce/agent-card";
import { RunList } from "@/components/workforce/run-list";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import { getAiRuntimeStatus } from "@/lib/ai/config";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { AGENT_DEFINITIONS } from "@/lib/workforce/agents";
import { getTenantScope } from "@/lib/tenant/context";

export default async function WorkforcePage() {
  const scope = await getTenantScope();
  const [runs, ai] = await Promise.all([
    getWorkforceRepository().listRuns(scope, { limit: 10 }),
    Promise.resolve(getAiRuntimeStatus()),
  ]);

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#F5E6C8] sm:text-xl">
              <Sparkles className="h-5 w-5 text-[#D4AF37]" />
              AI Workforce
            </h2>
            <p className="text-xs text-[#A89878] sm:text-sm">
              Module 3 — autonomous agents for sales, support, accounts, ops, and
              leadership.
            </p>
          </div>
          <div className="rounded-lg border border-[#3d3528] bg-[#141414] px-3 py-2 text-xs text-[#A89878]">
            AI:{" "}
            <span className="font-medium text-[#F9E076]">
              {ai.status === "live"
                ? `OpenAI · ${ai.model}`
                : ai.status === "heuristic"
                  ? "Heuristic (demo)"
                  : "Not configured"}
            </span>
          </div>
        </div>
      </header>
      <WorkforceNav />
      <div className="flex-1 overflow-y-auto p-4 space-y-8 sm:p-6">
        <section>
          <h3 className="mb-4 text-sm font-semibold text-[#F5E6C8]">Your AI team</h3>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {AGENT_DEFINITIONS.map((agent) => (
              <AgentCard key={agent.type} agent={agent} />
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Recent runs</h3>
          <RunList runs={runs} />
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "AI Workforce" };
