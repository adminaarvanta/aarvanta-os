import Link from "next/link";
import { AgentCard } from "@/components/workforce/agent-card";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import { WfHeader } from "@/components/workforce/workforce-shell";
import { getDirectoryAgentCards } from "@/lib/workforce/pipeline/agent-status";
import { getTenantScope } from "@/lib/tenant/context";

/** One job: list AI employees. */
export default async function WorkforcePage() {
  const scope = await getTenantScope();
  const directory = await getDirectoryAgentCards(scope);

  return (
    <>
      <WfHeader
        title="AI Workforce"
        subtitle="Your AI employees"
        actions={
          <Link
            href="/workforce/tasks?start=1"
            className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--wf-accent)" }}
          >
            + Start task
          </Link>
        }
      />
      <WorkforceNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <div
          className="mx-auto max-w-3xl overflow-hidden rounded-xl border bg-white shadow-[0_1px_3px_rgba(14,21,37,0.04)]"
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

export const metadata = { title: "AI Workforce" };
