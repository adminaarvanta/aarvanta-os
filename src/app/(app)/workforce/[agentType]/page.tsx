import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Crown,
  Headphones,
  Megaphone,
  Settings2,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { AgentProfileView } from "@/components/workforce/agent-profile-view";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import { WfHeader } from "@/components/workforce/workforce-shell";
import { getAgentMemoryRepository } from "@/lib/data/agent-memory-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { getAgentDefinition, isAgentType } from "@/lib/workforce/agents";
import { getAgentStatuses } from "@/lib/workforce/pipeline/agent-status";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";
import type { AgentType } from "@/types/workforce";

const icons: Record<AgentType, LucideIcon> = {
  ceo: Crown,
  coo: Settings2,
  sales_manager: Briefcase,
  marketing_manager: Megaphone,
  hr_manager: Users,
  cfo: Wallet,
  customer_success_manager: Headphones,
};

export default async function AgentPage({
  params,
}: {
  params: Promise<{ agentType: string }>;
}) {
  const { agentType } = await params;
  if (!isAgentType(agentType)) notFound();

  const agent = getAgentDefinition(agentType);
  const scope = await getTenantScope();
  const Icon = icons[agent.type];

  const [contacts, conversations, runs, memory, tasks, statuses] =
    await Promise.all([
      getCrmRepository().listContacts(scope),
      getRepository().listConversations(scope),
      getWorkforceRepository().listRuns(scope, { agentType, limit: 10 }),
      getAgentMemoryRepository().listMemory(scope, agentType),
      getCrmRepository().listTasks(scope, { assignedAgentType: agentType }),
      getAgentStatuses(scope),
    ]);

  const live = statuses.find((s) => s.agentType === agent.type);
  const working = live?.status === "working";

  return (
    <>
      <WfHeader
        title={agent.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{agent.title}</span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                background: working ? "var(--wf-ok-soft)" : "var(--wf-wait-soft)",
                color: working ? "var(--wf-ok)" : "#B45309",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: working ? "var(--wf-ok)" : "var(--wf-wait)",
                }}
              />
              {working ? "Working" : "Waiting"}
            </span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <div
              className="hidden h-11 w-11 items-center justify-center rounded-xl sm:flex"
              style={{ background: "var(--wf-accent-soft)" }}
            >
              <Icon className="h-5 w-5" style={{ color: "var(--wf-accent)" }} />
            </div>
            <Link
              href="/workforce/tasks?start=1"
              className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--wf-accent)" }}
            >
              + Assign goal
            </Link>
          </div>
        }
      />
      <div className="px-5 sm:px-8" style={{ background: "var(--wf-bg)" }}>
        <div className="mx-auto max-w-5xl pb-1">
          <Link
            href="/workforce"
            className="text-xs font-semibold"
            style={{ color: "var(--wf-accent)" }}
          >
            ← All AI employees
          </Link>
          <p className="mt-1 text-sm" style={{ color: "var(--wf-muted)" }}>
            {agent.tagline}
          </p>
        </div>
      </div>
      <WorkforceNav />
      <AgentProfileView
        agent={agent}
        contacts={contacts.map((c) => ({
          id: c.id,
          name: contactDisplayName(c),
        }))}
        conversations={conversations.map((c) => ({
          id: c.id,
          name: c.contact.name,
        }))}
        runs={runs}
        memory={memory}
        tasks={tasks}
      />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentType: string }>;
}) {
  const { agentType } = await params;
  if (!isAgentType(agentType)) return { title: "Agent" };
  return { title: getAgentDefinition(agentType).name };
}
