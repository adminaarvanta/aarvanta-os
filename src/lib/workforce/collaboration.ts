import { getAgentDefinition } from "@/lib/workforce/agents";
import { getWorkforceUpgradeRepository } from "@/lib/data/workforce-upgrade-store";
import { crmNow } from "@/lib/data/crm-helpers";
import { getCrmRepository } from "@/lib/data/crm-store";
import type { CollaborateInput } from "@/lib/data/workforce-upgrade-repository";
import type { TenantScope } from "@/types/communication";
import type { AgentCollaboration, AgentType } from "@/types/workforce";

export async function runAgentCollaboration(
  scope: TenantScope,
  input: CollaborateInput
): Promise<AgentCollaboration> {
  const repo = getWorkforceUpgradeRepository();
  const participants = [
    input.leadAgent,
    ...input.participantAgents.filter((a) => a !== input.leadAgent),
  ];

  const insights: string[] = [];
  for (const agentType of participants) {
    const agent = getAgentDefinition(agentType);
    insights.push(
      `${agent.name}: ${agent.primaryFunction} — review complete for "${input.title}".`
    );
  }

  const [contacts, deals, tasks] = await Promise.all([
    getCrmRepository().listContacts(scope),
    getCrmRepository().listDeals(scope),
    getCrmRepository().listTasks(scope),
  ]);

  const hotLeads = contacts.filter((c) => (c.leadScore ?? 0) >= 70);
  if (hotLeads.length > 0 && participants.includes("sales_manager")) {
    insights.push(
      `AI Sales Manager: ${hotLeads.length} hot lead(s) flagged for immediate follow-up.`
    );
  }
  const openDeals = deals.filter((d) => d.status === "open");
  if (openDeals.length > 0 && participants.includes("ceo")) {
    insights.push(
      `AI CEO: Pipeline at £${openDeals.reduce((s, d) => s + d.value, 0).toLocaleString()} across ${openDeals.length} open deal(s).`
    );
  }
  const agentTasks = tasks.filter((t) => t.assignedAgentType);
  if (agentTasks.length > 0 && participants.includes("coo")) {
    insights.push(
      `AI COO: ${agentTasks.length} task(s) currently assigned to AI agents.`
    );
  }

  const summary = `Collaboration between ${participants.map((a) => getAgentDefinition(a).name).join(", ")} on "${input.title}". ${insights.length} insight(s) generated.`;

  await repo.createSharedMemory(
    {
      title: `Collaboration: ${input.title}`,
      content: summary + "\n\n" + insights.join("\n"),
      contributedBy: participants,
      tags: ["collaboration", input.leadAgent],
      sourceRunIds: [],
    },
    scope
  );

  return repo.createCollaboration(
    {
      title: input.title,
      leadAgent: input.leadAgent,
      participantAgents: participants,
      status: "completed",
      summary,
      insights,
      assignedTaskIds: agentTasks.slice(0, 3).map((t) => t.id),
      completedAt: crmNow(),
    },
    scope
  );
}

export function quickBriefingLabel(agentType: AgentType): string {
  return getAgentDefinition(agentType).primaryFunction;
}
