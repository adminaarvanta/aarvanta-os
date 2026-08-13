import { getCrmRepository } from "@/lib/data/crm-store";
import { getKnowledgeRepository } from "@/lib/data/knowledge-store";
import { getFinanceStore, getHrStore } from "@/lib/data/platform-store";
import { getRepository } from "@/lib/data/repository";
import { searchKnowledgeChunks } from "@/lib/knowledge/search";
import { contactDisplayName } from "@/types/crm";
import type { TenantScope } from "@/types/communication";
import type { Conversation } from "@/types/communication";
import type { CrmCompany, CrmContact, CrmDeal } from "@/types/crm";

const KNOWLEDGE_DIGEST_MAX = 1600;
/** Max CRM list items when no focus entity is selected. */
const UNFOCUSED_LIST_CAP = 3;

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

function dealSummary(
  deal: CrmDeal,
  pipelines: { id: string; name: string; stages: { id: string; name: string }[] }[]
) {
  const pipeline = pipelines.find((p) => p.id === deal.pipelineId);
  return {
    id: deal.id,
    title: deal.title,
    value: deal.value,
    currency: deal.currency,
    status: deal.status,
    stageId: deal.stageId,
    stageName: pipeline?.stages.find((s) => s.id === deal.stageId)?.name ?? null,
    contactId: deal.contactId,
    accountId: deal.accountId,
  };
}

export async function buildWorkforceContext(
  scope: TenantScope,
  input: {
    contactId?: string;
    conversationId?: string;
    taskId?: string;
    dealId?: string;
    knowledgeTopic?: string;
  }
) {
  const crm = getCrmRepository();
  const inbox = getRepository();

  const [
    allContacts,
    allCompanies,
    allDeals,
    tasks,
    pipelines,
    conversations,
    hrCandidates,
    hrEmployees,
    hrCases,
    knowledgeChunks,
    invoices,
    expenses,
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
    getKnowledgeRepository().listChunks(scope),
    getFinanceStore().list(scope),
    getFinanceStore().listExpenses(scope),
  ]);

  const assignedTask = input.taskId
    ? (await crm.getTask(input.taskId, scope)) ??
      tasks.find((t) => t.id === input.taskId) ??
      null
    : null;

  let conversation = input.conversationId
    ? await inbox.getConversation(input.conversationId, scope)
    : null;

  const contactId =
    input.contactId ??
    assignedTask?.contactId ??
    conversation?.contact.id ??
    undefined;

  const dealId =
    input.dealId ?? assignedTask?.dealId ?? undefined;

  const focusEntity = Boolean(
    contactId || conversation || assignedTask || dealId
  );

  const contact = contactId
    ? (await crm.getContact(contactId, scope)) ??
      allContacts.find((c) => c.id === contactId) ??
      null
    : null;

  // If a contact is selected without an explicit thread, use that contact's
  // most recent inbox conversation — never another contact's thread.
  if (!conversation && contactId) {
    const forContact = conversations
      .filter((c) => c.contact.id === contactId)
      .sort(
        (a, b) =>
          new Date(b.lastActivityAt).getTime() -
          new Date(a.lastActivityAt).getTime()
      );
    conversation = forContact[0] ?? null;
  }

  const focusDeal =
    (dealId
      ? allDeals.find((d) => d.id === dealId) ??
        (await crm.getDeal(dealId, scope)) ??
        null
      : null) ??
    (assignedTask?.dealId
      ? allDeals.find((d) => d.id === assignedTask.dealId) ?? null
      : null);

  // Scope CRM to the focus entity — never dump the full seeded catalog.
  let scopedContacts: CrmContact[];
  let scopedCompanies: CrmCompany[];
  let scopedDeals: CrmDeal[];

  if (focusEntity) {
    const relatedDealIds = new Set<string>();
    if (focusDeal) relatedDealIds.add(focusDeal.id);

    scopedDeals = allDeals.filter((d) => {
      if (focusDeal && d.id === focusDeal.id) return true;
      if (contact && d.contactId === contact.id) return true;
      if (
        contact?.accountId &&
        d.accountId &&
        d.accountId === contact.accountId
      ) {
        return true;
      }
      if (assignedTask?.dealId && d.id === assignedTask.dealId) return true;
      return false;
    });
    for (const d of scopedDeals) relatedDealIds.add(d.id);

    const relatedContactIds = new Set<string>();
    if (contact) relatedContactIds.add(contact.id);
    for (const d of scopedDeals) {
      if (d.contactId) relatedContactIds.add(d.contactId);
    }

    const relatedCompanyIds = new Set<string>();
    if (contact?.accountId) relatedCompanyIds.add(contact.accountId);
    if (focusDeal?.accountId) relatedCompanyIds.add(focusDeal.accountId);
    for (const d of scopedDeals) {
      if (d.accountId) relatedCompanyIds.add(d.accountId);
    }

    scopedContacts = allContacts.filter((c) => relatedContactIds.has(c.id));
    if (contact && !scopedContacts.some((c) => c.id === contact.id)) {
      scopedContacts = [contact, ...scopedContacts];
    }
    scopedCompanies = allCompanies.filter((c) => relatedCompanyIds.has(c.id));
  } else {
    scopedDeals = allDeals
      .filter((d) => d.status === "open")
      .slice(0, UNFOCUSED_LIST_CAP);
    const contactIds = new Set(
      scopedDeals.map((d) => d.contactId).filter(Boolean) as string[]
    );
    const companyIds = new Set(
      scopedDeals.map((d) => d.accountId).filter(Boolean) as string[]
    );
    scopedContacts = allContacts
      .filter((c) => contactIds.has(c.id))
      .slice(0, UNFOCUSED_LIST_CAP);
    if (scopedContacts.length === 0) {
      scopedContacts = allContacts
        .filter((c) => (c.leadScore ?? 0) >= 70)
        .slice(0, UNFOCUSED_LIST_CAP);
    }
    scopedCompanies = allCompanies
      .filter((c) => companyIds.has(c.id))
      .slice(0, UNFOCUSED_LIST_CAP);
  }

  const deal = focusDeal;
  const dealPipeline = deal
    ? pipelines.find((p) => p.id === deal.pipelineId) ?? null
    : null;

  const company = contact?.accountId
    ? scopedCompanies.find((c) => c.id === contact.accountId) ??
      allCompanies.find((c) => c.id === contact.accountId) ??
      null
    : deal?.accountId
      ? scopedCompanies.find((c) => c.id === deal.accountId) ??
        allCompanies.find((c) => c.id === deal.accountId) ??
        null
      : null;

  const contactDeals = contact
    ? scopedDeals.filter((d) => d.contactId === contact.id)
    : [];
  const contactTasks = contact
    ? tasks.filter((t) => t.contactId === contact.id)
    : [];
  const contactActivities = contact
    ? await crm.listActivities(scope, { contactId: contact.id })
    : [];

  const openDeals = focusEntity
    ? scopedDeals.filter((d) => d.status === "open")
    : scopedDeals;
  const openTasks = focusEntity
    ? tasks.filter(
        (t) =>
          t.status !== "done" &&
          (t.contactId === contact?.id ||
            t.dealId === deal?.id ||
            t.id === assignedTask?.id)
      )
    : tasks.filter((t) => t.status !== "done");
  const hotLeads = focusEntity
    ? scopedContacts.filter((c) => (c.leadScore ?? 0) >= 70)
    : allContacts
        .filter((c) => (c.leadScore ?? 0) >= 70)
        .slice(0, UNFOCUSED_LIST_CAP);
  const urgentConversations = focusEntity
    ? conversations.filter(
        (c) =>
          (!contactId || c.contact.id === contactId) &&
          (c.sentiment === "urgent" || c.sentiment === "frustrated")
      )
    : conversations
        .filter(
          (c) => c.sentiment === "urgent" || c.sentiment === "frustrated"
        )
        .slice(0, UNFOCUSED_LIST_CAP);

  // Only search Knowledge Hub when we have topic/task/goal text — never invent a query.
  const knowledgeTopic =
    input.knowledgeTopic?.trim() ||
    [
      assignedTask?.title,
      assignedTask?.description,
      deal ? `deal ${deal.title}` : "",
      contact ? `customer ${contactDisplayName(contact)}` : "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  let knowledgeDigest = "";
  if (knowledgeTopic && knowledgeChunks.length) {
    const hits = await searchKnowledgeChunks(
      knowledgeChunks,
      knowledgeTopic,
      5
    );
    if (hits.length) {
      const parts: string[] = [];
      let used = 0;
      for (const hit of hits) {
        const title = hit.chunk.documentTitle?.trim() || "Document";
        const content = hit.chunk.content.trim().replace(/\s+/g, " ");
        const block = `[${title}] ${content}`;
        if (used + block.length + 2 > KNOWLEDGE_DIGEST_MAX) {
          const room = KNOWLEDGE_DIGEST_MAX - used - 2;
          if (room > 80) parts.push(block.slice(0, room) + "…");
          break;
        }
        parts.push(block);
        used += block.length + 2;
      }
      knowledgeDigest = parts.join("\n\n");
    }
  }

  const invoiceOpen = invoices.filter(
    (i) => i.status === "sent" || i.status === "overdue" || i.status === "draft"
  );
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");

  return {
    business: {
      focused: focusEntity,
      contactCount: focusEntity ? scopedContacts.length : allContacts.length,
      companyCount: focusEntity ? scopedCompanies.length : allCompanies.length,
      openDealCount: focusEntity
        ? openDeals.length
        : allDeals.filter((d) => d.status === "open").length,
      pipelineValue: (
        focusEntity ? openDeals : allDeals.filter((d) => d.status === "open")
      ).reduce((s, d) => s + d.value, 0),
      weightedForecast: (
        focusEntity ? openDeals : allDeals.filter((d) => d.status === "open")
      ).reduce((s, d) => s + d.value * (d.probability / 100), 0),
      openTaskCount: focusEntity
        ? openTasks.length
        : tasks.filter((t) => t.status !== "done").length,
      hotLeadCount: focusEntity
        ? hotLeads.length
        : allContacts.filter((c) => (c.leadScore ?? 0) >= 70).length,
      urgentConversationCount: focusEntity
        ? urgentConversations.length
        : conversations.filter(
            (c) => c.sentiment === "urgent" || c.sentiment === "frustrated"
          ).length,
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
    /** Related or capped sample deals — never the full seeded catalog. */
    deals: scopedDeals
      .slice(0, focusEntity ? 10 : UNFOCUSED_LIST_CAP)
      .map((d) => dealSummary(d, pipelines)),
    companies: scopedCompanies.slice(0, focusEntity ? 5 : UNFOCUSED_LIST_CAP).map(
      (c) => ({
        id: c.id,
        name: c.name,
        industry: c.industry,
      })
    ),
    hotLeads: hotLeads.slice(0, UNFOCUSED_LIST_CAP).map((c) => ({
      id: c.id,
      name: contactDisplayName(c),
      score: c.leadScore,
    })),
    urgentThreads: urgentConversations.slice(0, UNFOCUSED_LIST_CAP).map((c) => ({
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
    knowledge: {
      chunkCount: knowledgeChunks.length,
      topic: knowledgeTopic || null,
      digest: knowledgeDigest || null,
      grounded: Boolean(knowledgeDigest),
    },
    finance: {
      invoiceCount: invoices.length,
      openInvoiceCount: invoiceOpen.length,
      overdueInvoiceCount: overdueInvoices.length,
      openInvoiceTotal: invoiceOpen.reduce((s, i) => s + i.amount, 0),
      expenseTotal: expenses.reduce((s, e) => s + e.amount, 0),
      recentInvoices: invoices.slice(0, 5).map((i) => ({
        id: i.id,
        number: i.number,
        amount: i.amount,
        status: i.status,
        clientName: i.clientName,
      })),
    },
  };
}

export type WorkforceContext = Awaited<ReturnType<typeof buildWorkforceContext>>;
