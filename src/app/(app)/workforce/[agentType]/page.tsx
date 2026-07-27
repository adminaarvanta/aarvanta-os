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
import { getAgentMemoryRepository } from "@/lib/data/agent-memory-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { getAgentDefinition, isAgentType } from "@/lib/workforce/agents";
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

  const [contacts, conversations, runs, memory, tasks] = await Promise.all([
    getCrmRepository().listContacts(scope),
    getRepository().listConversations(scope),
    getWorkforceRepository().listRuns(scope, { agentType, limit: 10 }),
    getAgentMemoryRepository().listMemory(scope, agentType),
    getCrmRepository().listTasks(scope, { assignedAgentType: agentType }),
  ]);

  return (
    <>
      <header
        className="shrink-0 border-b px-4 py-4 sm:px-6"
        style={{ background: "var(--wf-panel)", borderColor: "var(--wf-line)" }}
      >
        <Link
          href="/workforce"
          className="text-xs font-semibold"
          style={{ color: "var(--wf-accent)" }}
        >
          ← AI Workforce
        </Link>
        <div className="mt-2 flex items-start gap-3">
          <div
            className="rounded-2xl p-2.5"
            style={{ background: "var(--wf-accent-soft)" }}
          >
            <Icon className="h-5 w-5" style={{ color: "var(--wf-accent)" }} />
          </div>
          <div>
            <h2
              className="text-lg font-bold sm:text-xl"
              style={{ color: "var(--wf-ink)" }}
            >
              {agent.name}
            </h2>
            <p className="text-xs font-semibold" style={{ color: "var(--wf-accent)" }}>
              {agent.title}
            </p>
            <p className="mt-1 text-xs sm:text-sm" style={{ color: "var(--wf-muted)" }}>
              {agent.tagline} · {agent.primaryFunction}
            </p>
          </div>
        </div>
      </header>
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
