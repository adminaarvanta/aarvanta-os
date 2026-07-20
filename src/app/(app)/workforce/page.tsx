import { Sparkles } from "lucide-react";
import { AgentCard } from "@/components/workforce/agent-card";
import { AgentDirectory } from "@/components/workforce/agent-directory";
import { RunList } from "@/components/workforce/run-list";
import { SeedCrmSampleButton } from "@/components/crm/seed-crm-sample-button";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import { WorkforceUpgradePanel } from "@/components/workforce/workforce-upgrade-panel";
import { getAiRuntimeStatus } from "@/lib/ai/config";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { getWorkforceUpgradeRepository } from "@/lib/data/workforce-upgrade-store";
import { AGENT_DEFINITIONS } from "@/lib/workforce/agents";
import { getTenantScope } from "@/lib/tenant/context";

export default async function WorkforcePage() {
  const scope = await getTenantScope();
  const upgradeRepo = getWorkforceUpgradeRepository();
  const [runs, ai, sharedMemory, collaborations] = await Promise.all([
    getWorkforceRepository().listRuns(scope, { limit: 10 }),
    Promise.resolve(getAiRuntimeStatus()),
    upgradeRepo.listSharedMemory(scope),
    upgradeRepo.listCollaborations(scope),
  ]);

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground sm:text-xl">
              <Sparkles className="h-5 w-5 text-gold" />
              AI Workforce
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              AI Employee Directory — 7 agents with shared memory, collaboration, chat, and tasks.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-muted">
            AI:{" "}
            <span className="font-medium text-gold-bright">
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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-8 sm:p-6">
        <section className="rounded-xl border border-border bg-surface-elevated p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">
            Test agents with sample CRM data
          </p>
          <p className="text-xs text-muted">
            Loads companies, leads, pipeline deals, and open tasks assigned to each
            AI agent. Then open an agent → Tasks → Complete with agent.
          </p>
          <SeedCrmSampleButton />
        </section>

        <section>
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            AI Employee Directory
          </h3>
          <AgentDirectory />
        </section>

        <section>
          <h3 className="mb-4 text-sm font-semibold text-foreground">Quick access</h3>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {AGENT_DEFINITIONS.map((agent) => (
              <AgentCard key={agent.type} agent={agent} />
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Shared memory & agent collaboration
          </h3>
          <WorkforceUpgradePanel
            sharedMemory={sharedMemory}
            collaborations={collaborations}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Recent runs</h3>
          <RunList runs={runs} />
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "AI Workforce" };
