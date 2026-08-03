import { AgentCard } from "@/components/workforce/agent-card";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import { WfHeader } from "@/components/workforce/workforce-shell";
import { getDirectoryAgentCards } from "@/lib/workforce/pipeline/agent-status";
import { getTenantScope } from "@/lib/tenant/context";

/** Settings — AI Employees directory (profiles under the hood). */
export default async function WorkforceSettingsPage() {
  const scope = await getTenantScope();
  const directory = await getDirectoryAgentCards(scope);

  return (
    <>
      <WfHeader
        title="AI Employees"
        subtitle="Profiles, memory, and specialist tools"
      />
      <WorkforceNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <div
          className="mx-auto max-w-5xl overflow-hidden rounded-xl border bg-white shadow-[0_1px_3px_rgba(14,21,37,0.04)]"
          style={{ borderColor: "var(--wf-line)" }}
        >
          <div className="divide-y" style={{ borderColor: "var(--wf-line)" }}>
            {directory.map(({ agent, status, performance }) => (
              <div key={agent.type} style={{ borderColor: "var(--wf-line)" }}>
                <AgentCard
                  agent={agent}
                  status={status.status}
                  performance={performance}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export const metadata = { title: "AI Employees" };
