import { getCrmRepository } from "@/lib/data/crm-store";
import { getKnowledgeRepository } from "@/lib/data/knowledge-store";
import { getProjectRepository } from "@/lib/data/project-store";
import { getRepository } from "@/lib/data/repository";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { contactDisplayName } from "@/types/crm";
import type { FounderSnapshot } from "@/types/founder";
import type { TenantScope } from "@/types/communication";
import { crmNow } from "@/lib/data/crm-helpers";

export async function buildFounderSnapshot(
  scope: TenantScope
): Promise<FounderSnapshot> {
  const [crm, inbox, projects, knowledge, workforce, workflows] =
    await Promise.all([
      Promise.all([
        getCrmRepository().listContacts(scope),
        getCrmRepository().listDeals(scope),
        getCrmRepository().listTasks(scope),
      ]),
      getRepository().listConversations(scope),
      Promise.all([
        getProjectRepository().listProjects(scope),
        getProjectRepository().listTasks(scope),
      ]),
      getKnowledgeRepository().listDocuments(scope),
      getWorkforceRepository().listRuns(scope, { limit: 20 }),
      getWorkflowRepository().listRuns(scope),
    ]);

  const [contacts, deals, crmTasks] = crm;
  const [projectList, projectTasks] = projects;

  const openDeals = deals.filter((d) => d.status === "open");
  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
  const weightedForecast = openDeals.reduce(
    (s, d) => s + d.value * (d.probability / 100),
    0
  );
  const hotLeads = contacts.filter((c) => (c.leadScore ?? 0) >= 70);
  const urgentConversations = inbox.filter(
    (c) => c.sentiment === "urgent" || c.sentiment === "frustrated"
  );

  const today = new Date().toISOString().slice(0, 10);
  const overdueProjectTasks = projectTasks.filter(
    (t) => t.status !== "done" && t.dueDate && t.dueDate < today
  );
  const openProjectTasks = projectTasks.filter((t) => t.status !== "done");

  const topOpportunities = [...openDeals]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((d) => {
      const contact = contacts.find((c) => c.id === d.contactId);
      return {
        title: d.title,
        value: d.value,
        contact: contact ? contactDisplayName(contact) : undefined,
      };
    });

  const pendingApprovals = workflows.filter(
    (r) => r.status === "awaiting_approval"
  ).length;

  const focus: string[] = [];
  if (hotLeads.length > 0) {
    focus.push(`${hotLeads.length} hot lead(s) need outreach — start with ${contactDisplayName(hotLeads[0]!)}.`);
  }
  if (urgentConversations.length > 0) {
    focus.push(`${urgentConversations.length} urgent inbox conversation(s) require attention.`);
  }
  if (pendingApprovals > 0) {
    focus.push(`${pendingApprovals} workflow(s) awaiting your approval.`);
  }
  if (overdueProjectTasks.length > 0) {
    focus.push(`${overdueProjectTasks.length} overdue project task(s).`);
  }
  const openCrmTasks = crmTasks.filter((t) => t.status !== "done");
  if (openCrmTasks.length > 5) {
    focus.push(`${openCrmTasks.length} open CRM tasks — review priorities.`);
  }
  if (focus.length === 0) {
    focus.push("Pipeline healthy. Consider running AI CEO for a daily briefing.");
  }

  return {
    generatedAt: crmNow(),
    revenue: {
      pipelineValue,
      weightedForecast: Math.round(weightedForecast),
      openDeals: openDeals.length,
      currency: "GBP",
    },
    sales: {
      hotLeads: hotLeads.length,
      totalContacts: contacts.length,
      topOpportunities,
    },
    inbox: {
      totalConversations: inbox.length,
      urgentCount: urgentConversations.length,
      unreadEstimate: inbox.filter((c) => c.unreadCount > 0).length,
    },
    projects: {
      active: projectList.filter((p) => p.status === "active").length,
      openTasks: openProjectTasks.length,
      overdueTasks: overdueProjectTasks.length,
    },
    knowledge: {
      documentCount: knowledge.length,
      readyDocuments: knowledge.filter((d) => d.status === "ready").length,
    },
    workforce: {
      recentRuns: workforce.length,
      pendingWorkflowApprovals: pendingApprovals,
    },
    focus,
  };
}

export async function buildFounderCopilotContext(scope: TenantScope) {
  const snapshot = await buildFounderSnapshot(scope);

  const [knowledgeChunks, recentRuns] = await Promise.all([
    getKnowledgeRepository().listChunks(scope),
    getWorkforceRepository().listRuns(scope, { limit: 5 }),
  ]);

  return {
    snapshot,
    knowledgeExcerpt: knowledgeChunks.slice(0, 8).map((c) => ({
      title: c.documentTitle,
      content: c.content.slice(0, 300),
    })),
    recentAgentRuns: recentRuns.map((r) => ({
      agent: r.agentType,
      summary: r.summary.slice(0, 200),
      status: r.status,
    })),
  };
}

export type FounderCopilotContext = Awaited<
  ReturnType<typeof buildFounderCopilotContext>
>;
