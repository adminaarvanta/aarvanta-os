import { Sparkles } from "lucide-react";
import Link from "next/link";
import { AgentCard } from "@/components/workforce/agent-card";
import { AgentDirectory } from "@/components/workforce/agent-directory";
import { RunList } from "@/components/workforce/run-list";
import { SeedCrmSampleButton } from "@/components/crm/seed-crm-sample-button";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import { WorkforceUpgradePanel } from "@/components/workforce/workforce-upgrade-panel";
import { getAiRuntimeStatus } from "@/lib/ai/config";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { getWorkforceUpgradeRepository } from "@/lib/data/workforce-upgrade-store";
import { getDirectoryAgentCards } from "@/lib/workforce/pipeline/agent-status";
import { getTenantScope } from "@/lib/tenant/context";
import type { AgentLiveStatus, AgentPerformance, AgentType } from "@/types/workforce";

export default async function WorkforcePage() {
  const scope = await getTenantScope();
  const upgradeRepo = getWorkforceUpgradeRepository();
  const [runs, ai, sharedMemory, collaborations, directory] = await Promise.all([
    getWorkforceRepository().listRuns(scope, { limit: 10 }),
    Promise.resolve(getAiRuntimeStatus()),
    upgradeRepo.listSharedMemory(scope),
    upgradeRepo.listCollaborations(scope),
    getDirectoryAgentCards(scope),
  ]);

  const statuses = Object.fromEntries(
    directory.map((d) => [d.agent.type, d.status.status])
  ) as Partial<Record<AgentType, AgentLiveStatus>>;
  const performance = Object.fromEntries(
    directory.map((d) => [d.agent.type, d.performance])
  ) as Partial<Record<AgentType, AgentPerformance>>;

  const workingCount = directory.filter((d) => d.status.status === "working").length;

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
              Assign business goals — the orchestrator picks AI employees, tools, and
              approvals.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/workforce/tasks?start=1"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black hover:bg-gold-bright"
            >
              Start task
            </Link>
            <div className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-muted">
              {workingCount} working · AI:{" "}
              <span className="font-medium text-gold-bright">
                {ai.status === "live"
                  ? `OpenAI · ${ai.model}`
                  : ai.status === "heuristic"
                    ? "Heuristic (demo)"
                    : "Not configured"}
              </span>
            </div>
          </div>
        </div>
      </header>
      <WorkforceNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-8 sm:p-6">
        <section>
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            AI Employee Directory
          </h3>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {directory.map(({ agent, status, performance: perf }) => (
              <AgentCard
                key={agent.type}
                agent={agent}
                status={status.status}
                performance={perf}
              />
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            By department
          </h3>
          <AgentDirectory statuses={statuses} performance={performance} />
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
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Recent agent runs
          </h3>
          <RunList runs={runs} />
        </section>

        <details className="rounded-xl border border-border bg-surface-elevated p-4">
          <summary className="cursor-pointer text-sm font-medium text-muted">
            Dev tools
          </summary>
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted">
              Loads sample CRM companies, leads, deals, and open tasks for agents.
            </p>
            <SeedCrmSampleButton />
          </div>
        </details>
      </div>
    </>
  );
}

export const metadata = { title: "AI Workforce" };
