import { getCrmRepository } from "@/lib/data/crm-store";
import { getKnowledgeRepository } from "@/lib/data/knowledge-store";
import { listProposalDocuments } from "@/lib/data/platform-store";
import { getProjectRepository } from "@/lib/data/project-store";
import { getRepository } from "@/lib/data/repository";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { conversationOsHref } from "@/lib/channels/conversation-href";
import { searchFeatures } from "@/lib/search/features";
import { contactDisplayName } from "@/types/crm";
import type { GlobalSearchResult } from "@/types/search";
import type { TenantScope } from "@/types/communication";

function matchesQuery(values: Array<string | undefined>, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const haystack = values.filter(Boolean).join(" ").toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}

function rankMatch(values: Array<string | undefined>, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const primary = (values[0] ?? "").toLowerCase();
  if (primary.startsWith(q)) return 3;
  if (primary.includes(q)) return 2;
  return 1;
}

export async function runGlobalSearch(
  scope: TenantScope,
  query: string,
  limit = 20
): Promise<GlobalSearchResult[]> {
  const q = query.trim();
  const featureLimit = Math.min(8, limit);
  const recordLimit = Math.max(limit - featureLimit, 8);

  const features = searchFeatures(q, featureLimit);

  if (!q) {
    return features;
  }

  if (q.length < 2) {
    return features;
  }

  const crm = getCrmRepository();
  const loadHeavyCollections = q.length >= 3;

  const [contacts, companies, deals, projects, documents, conversations, workflows, proposals] =
    await Promise.all([
      crm.listContacts(scope),
      crm.listCompanies(scope),
      crm.listDeals(scope),
      loadHeavyCollections
        ? getProjectRepository().listProjects(scope)
        : Promise.resolve([]),
      loadHeavyCollections
        ? getKnowledgeRepository().listDocuments(scope)
        : Promise.resolve([]),
      loadHeavyCollections
        ? getRepository().listConversations(scope)
        : Promise.resolve([]),
      loadHeavyCollections
        ? getWorkflowRepository().listWorkflows(scope)
        : Promise.resolve([]),
      loadHeavyCollections
        ? listProposalDocuments(scope)
        : Promise.resolve([]),
    ]);

  const records: GlobalSearchResult[] = [];

  for (const contact of contacts) {
    const name = contactDisplayName(contact);
    if (
      matchesQuery(
        [name, contact.email, contact.phone, contact.jobTitle, contact.notes, ...contact.tags],
        q
      )
    ) {
      records.push({
        id: `contact_${contact.id}`,
        kind: "contact",
        group: "CRM",
        title: name,
        subtitle: contact.email ?? contact.jobTitle ?? "Contact",
        href: `/crm/contacts/${contact.id}`,
      });
    }
  }

  for (const company of companies) {
    if (
      matchesQuery(
        [company.name, company.domain, company.industry, company.notes, ...company.tags],
        q
      )
    ) {
      records.push({
        id: `company_${company.id}`,
        kind: "company",
        group: "CRM",
        title: company.name,
        subtitle: company.domain ?? company.industry ?? "Company",
        href: `/crm/companies/${company.id}`,
      });
    }
  }

  for (const deal of deals) {
    if (matchesQuery([deal.title, deal.notes, deal.currency], q)) {
      records.push({
        id: `deal_${deal.id}`,
        kind: "deal",
        group: "CRM",
        title: deal.title,
        subtitle: deal.value != null ? `${deal.currency} ${deal.value.toLocaleString()}` : "Deal",
        href: `/crm/deals/${deal.id}`,
      });
    }
  }

  for (const project of projects) {
    if (
      matchesQuery(
        [project.name, project.description, project.status, ...project.tags],
        q
      )
    ) {
      records.push({
        id: `project_${project.id}`,
        kind: "project",
        group: "Projects",
        title: project.name,
        subtitle: project.status.replace("_", " "),
        href: `/projects/${project.id}`,
      });
    }
  }

  for (const doc of documents) {
    if (
      matchesQuery(
        [doc.title, doc.fileName, doc.summary, ...doc.tags],
        q
      )
    ) {
      records.push({
        id: `document_${doc.id}`,
        kind: "document",
        group: "Knowledge",
        title: doc.title,
        subtitle: doc.fileName,
        href: `/knowledge/${doc.id}`,
      });
    }
  }

  for (const conversation of conversations) {
    if (
      matchesQuery(
        [
          conversation.contact.name,
          conversation.contact.email,
          conversation.contact.phone,
          conversation.aiSummary,
          ...conversation.tags,
        ],
        q
      )
    ) {
      records.push({
        id: `conversation_${conversation.id}`,
        kind: "conversation",
        group: "Inbox",
        title: conversation.contact.name,
        subtitle: conversation.aiSummary ?? conversation.channels.join(", "),
        href: conversationOsHref(conversation),
      });
    }
  }

  for (const workflow of workflows) {
    if (
      matchesQuery(
        [workflow.name, workflow.description, ...workflow.tags],
        q
      )
    ) {
      records.push({
        id: `workflow_${workflow.id}`,
        kind: "workflow",
        group: "Workflows",
        title: workflow.name,
        subtitle: workflow.description ?? "Workflow",
        href: `/workflows/${workflow.id}`,
      });
    }
  }

  for (const proposal of proposals) {
    if (matchesQuery([proposal.title, proposal.clientName, proposal.content], q)) {
      records.push({
        id: `proposal_${proposal.id}`,
        kind: "proposal",
        group: "Proposals",
        title: proposal.title,
        subtitle: proposal.clientName,
        href: "/proposals",
      });
    }
  }

  records.sort((a, b) => {
    const rankDiff =
      rankMatch([b.title], q) - rankMatch([a.title], q);
    if (rankDiff !== 0) return rankDiff;
    return a.title.localeCompare(b.title);
  });

  return [...features, ...records.slice(0, recordLimit)].slice(0, limit);
}
