import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Crown,
  Megaphone,
  Settings2,
  Users,
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
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/workforce"
          className="text-xs text-[#D4AF37] hover:underline"
        >
          ← AI Workforce
        </Link>
        <div className="mt-2 flex items-start gap-3">
          <div className="rounded-lg bg-[#D4AF37]/15 p-2.5 ring-1 ring-[#D4AF37]/30">
            <Icon className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#F5E6C8] sm:text-xl">
              {agent.name}
            </h2>
            <p className="text-xs text-[#D4AF37]">{agent.title}</p>
            <p className="mt-1 text-xs text-[#A89878] sm:text-sm">
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
