import { notFound } from "next/navigation";
import Link from "next/link";
import { AgentRunPanel } from "@/components/workforce/agent-run-panel";
import { RunList } from "@/components/workforce/run-list";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { getAgentDefinition, isAgentType } from "@/lib/workforce/agents";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ agentType: string }>;
}) {
  const { agentType } = await params;
  if (!isAgentType(agentType)) notFound();

  const agent = getAgentDefinition(agentType);
  const scope = await getTenantScope();

  const [contacts, conversations, runs] = await Promise.all([
    getCrmRepository().listContacts(scope),
    getRepository().listConversations(scope),
    getWorkforceRepository().listRuns(scope, { agentType, limit: 10 }),
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
        <h2 className="mt-1 text-lg font-semibold text-[#F5E6C8] sm:text-xl">
          {agent.name}
        </h2>
        <p className="text-xs text-[#A89878] sm:text-sm">{agent.tagline}</p>
      </header>
      <WorkforceNav />
      <div className="flex-1 overflow-y-auto p-4 space-y-6 sm:p-6">
        <AgentRunPanel
          agent={agent}
          contacts={contacts.map((c) => ({
            id: c.id,
            name: contactDisplayName(c),
          }))}
          conversations={conversations.map((c) => ({
            id: c.id,
            name: c.contact.name,
          }))}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">
            Recent runs
          </h3>
          <RunList runs={runs} />
        </section>
      </div>
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
