import { getCrmRepository } from "@/lib/data/crm-store";
import { getHrStore } from "@/lib/data/platform-store";
import { getRepository } from "@/lib/data/repository";
import { contactDisplayName } from "@/types/crm";
import type { TenantScope } from "@/types/communication";
import type { Conversation } from "@/types/communication";

function timelineSnippet(conversation: Conversation, limit = 8) {
  return [...conversation.timeline]
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
    .slice(0, limit)
    .map((e) => {
      if (e.type === "message") {
        return `[${e.direction} ${e.channel}] ${e.content.slice(0, 200)}`;
      }
      if (e.type === "email") {
        return `[email ${e.direction}] ${e.subject}: ${e.bodyPreview.slice(0, 120)}`;
      }
      if (e.type === "call") {
        return `[call ${e.direction}] ${e.summary ?? `${e.durationSeconds}s`}`;
      }
      if (e.type === "note") {
        return `[note] ${e.content.slice(0, 120)}`;
      }
      return `[${e.type}]`;
    });
}

export async function buildWorkforceContext(
  scope: TenantScope,
  input: { contactId?: string; conversationId?: string; taskId?: string }
) {
  const crm = getCrmRepository();
  const inbox = getRepository();

  const [
    contacts,
    companies,
    deals,
    tasks,
    pipelines,
    conversations,
    hrCandidates,
    hrEmployees,
    hrCases,
  ] = await Promise.all([
    crm.listContacts(scope),
    crm.listCompanies(scope),
    crm.listDeals(scope),
    crm.listTasks(scope),
    crm.listPipelines(scope),
    inbox.listConversations(scope),
    getHrStore().list(scope),
    getHrStore().listEmployees(scope),
    getHrStore().listCases(scope),
  ]);

  const assignedTask = input.taskId
    ? (await crm.getTask(input.taskId, scope)) ??
      tasks.find((t) => t.id === input.taskId) ??
      null
    : null;

  const contactId = input.contactId ?? assignedTask?.contactId;
  const contact = contactId ? await crm.getContact(contactId, scope) : null;
  const conversation = input.conversationId
    ? await inbox.getConversation(input.conversationId, scope)
    : null;

  const deal = assignedTask?.dealId
    ? deals.find((d) => d.id === assignedTask.dealId) ?? null
    : null;
  const dealPipeline = deal
    ? pipelines.find((p) => p.id === deal.pipelineId) ?? null
    : null;

  const company = contact?.accountId
    ? companies.find((c) => c.id === contact.accountId) ?? null
    : null;

  const contactDeals = contact
    ? deals.filter((d) => d.contactId === contact.id)
    : [];
  const contactTasks = contact
    ? tasks.filter((t) => t.contactId === contact.id)
    : [];
  const contactActivities = contact
    ? await crm.listActivities(scope, { contactId: contact.id })
    : [];

  const openDeals = deals.filter((d) => d.status === "open");
  const openTasks = tasks.filter((t) => t.status !== "done");
  const hotLeads = contacts.filter((c) => (c.leadScore ?? 0) >= 70);
  const urgentConversations = conversations.filter(
    (c) => c.sentiment === "urgent" || c.sentiment === "frustrated"
  );

  return {
    business: {
      contactCount: contacts.length,
      companyCount: companies.length,
      openDealCount: openDeals.length,
      pipelineValue: openDeals.reduce((s, d) => s + d.value, 0),
      weightedForecast: openDeals.reduce(
        (s, d) => s + d.value * (d.probability / 100),
        0
      ),
      openTaskCount: openTasks.length,
      hotLeadCount: hotLeads.length,
      urgentConversationCount: urgentConversations.length,
      pipelines: pipelines.map((p) => p.name),
    },
    contact: contact
      ? {
          id: contact.id,
          name: contactDisplayName(contact),
          email: contact.email,
          phone: contact.phone,
          jobTitle: contact.jobTitle,
          tags: contact.tags,
          leadScore: contact.leadScore,
          leadScoreReason: contact.leadScoreReason,
          purchaseTotal: contact.purchaseTotal,
          company: company?.name,
          openDeals: contactDeals
            .filter((d) => d.status === "open")
            .map((d) => ({ title: d.title, value: d.value, stageId: d.stageId })),
          openTasks: contactTasks.map((t) => ({
            title: t.title,
            status: t.status,
            priority: t.priority,
          })),
          recentActivities: contactActivities.slice(0, 5).map((a) => ({
            type: a.type,
            title: a.title,
          })),
        }
      : null,
    conversation: conversation
      ? {
          id: conversation.id,
          contactName: conversation.contact.name,
          channels: conversation.channels,
          tags: conversation.tags,
          sentiment: conversation.sentiment,
          aiSummary: conversation.aiSummary,
          timeline: timelineSnippet(conversation),
        }
      : null,
    assignedTask: assignedTask
      ? {
          id: assignedTask.id,
          title: assignedTask.title,
          description: assignedTask.description,
          status: assignedTask.status,
          priority: assignedTask.priority,
          dueDate: assignedTask.dueDate,
          contactId: assignedTask.contactId,
          accountId: assignedTask.accountId,
          dealId: assignedTask.dealId,
          source: assignedTask.source,
        }
      : null,
    deal: deal
      ? {
          id: deal.id,
          title: deal.title,
          value: deal.value,
          currency: deal.currency,
          status: deal.status,
          stageId: deal.stageId,
          stageName:
            dealPipeline?.stages.find((s) => s.id === deal.stageId)?.name ??
            null,
          pipelineId: deal.pipelineId,
          pipelineName: dealPipeline?.name ?? null,
          stages:
            dealPipeline?.stages
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((s) => ({
                id: s.id,
                name: s.name,
                order: s.order,
                probability: s.probability,
              })) ?? [],
          notes: deal.notes,
          expectedCloseDate: deal.expectedCloseDate,
        }
      : null,
    hotLeads: hotLeads.slice(0, 5).map((c) => ({
      id: c.id,
      name: contactDisplayName(c),
      score: c.leadScore,
    })),
    urgentThreads: urgentConversations.slice(0, 5).map((c) => ({
      id: c.id,
      name: c.contact.name,
      sentiment: c.sentiment,
    })),
    hr: {
      candidateCount: hrCandidates.length,
      employeeCount: hrEmployees.length,
      openCases: hrCases
        .filter((item) =>
          ["pending_approval", "triaging", "generating", "ready_to_send"].includes(
            item.status
          )
        )
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          subjectName: item.subjectName,
          status: item.status,
          documentType: item.proposedDocumentType,
          conversationId: item.conversationId,
        })),
      candidates: hrCandidates.slice(0, 5).map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        status: c.status,
        score: c.score,
      })),
      employees: hrEmployees.slice(0, 5).map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        department: e.department,
        leaveBalance: e.leaveBalance,
      })),
    },
  };
}

export type WorkforceContext = Awaited<ReturnType<typeof buildWorkforceContext>>;
