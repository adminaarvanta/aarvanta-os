import {
  DEMO_CRM_ACTIVITIES,
  DEMO_CRM_COMPANIES,
  DEMO_CRM_CONTACTS,
  DEMO_CRM_DEALS,
  DEMO_CRM_PIPELINES,
  DEMO_CRM_TASKS,
} from "@/lib/data/crm-demo-seed";
import {
  crmNewId,
  crmNow,
  inCrmScope,
  sumPurchases,
} from "@/lib/data/crm-helpers";
import type { CrmRepository } from "@/lib/data/crm-repository";
import type { TenantScope } from "@/types/communication";
import type {
  CrmActivity,
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmPipeline,
  CrmTask,
} from "@/types/crm";

let contacts = [...DEMO_CRM_CONTACTS];
let companies = [...DEMO_CRM_COMPANIES];
let pipelines = [...DEMO_CRM_PIPELINES];
let deals = [...DEMO_CRM_DEALS];
let tasks = [...DEMO_CRM_TASKS];
let activities = [...DEMO_CRM_ACTIVITIES];

function scoped<T extends { tenantId: string; workspaceId: string; companyId: string }>(
  items: T[],
  scope: TenantScope
) {
  return items.filter((item) => inCrmScope(item, scope));
}

export const crmMemoryRepository: CrmRepository = {
  async listContacts(scope, filters) {
    let items = scoped(contacts, scope);
    if (filters?.accountId) {
      items = items.filter((c) => c.accountId === filters.accountId);
    }
    return items.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getContact(id, scope) {
    const item = contacts.find((c) => c.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },

  async createContact(input, scope) {
    const now = crmNow();
    const purchases = input.purchases ?? [];
    const contact: CrmContact = {
      ...scope,
      id: crmNewId("crm_contact"),
      ...input,
      purchases,
      purchaseTotal: sumPurchases(purchases),
      currency: "GBP",
      conversationIds: input.conversationIds ?? [],
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    contacts = [contact, ...contacts];
    return contact;
  },

  async updateContact(id, patch, scope) {
    const idx = contacts.findIndex((c) => c.id === id && inCrmScope(c, scope));
    if (idx < 0) return null;
    const updated: CrmContact = {
      ...contacts[idx],
      ...patch,
      updatedAt: crmNow(),
    };
    if (patch.purchases) {
      updated.purchaseTotal = sumPurchases(patch.purchases);
    }
    contacts[idx] = updated;
    return updated;
  },

  async deleteContact(id, scope) {
    const before = contacts.length;
    contacts = contacts.filter((c) => !(c.id === id && inCrmScope(c, scope)));
    return contacts.length < before;
  },

  async listCompanies(scope) {
    return scoped(companies, scope).sort((a, b) => a.name.localeCompare(b.name));
  },

  async getCompany(id, scope) {
    const item = companies.find((c) => c.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },

  async createCompany(input, scope) {
    const now = crmNow();
    const company: CrmCompany = {
      ...scope,
      id: crmNewId("acct"),
      ...input,
      tags: input.tags ?? [],
      purchaseTotal: 0,
      currency: "GBP",
      createdAt: now,
      updatedAt: now,
    };
    companies = [company, ...companies];
    return company;
  },

  async updateCompany(id, patch, scope) {
    const idx = companies.findIndex((c) => c.id === id && inCrmScope(c, scope));
    if (idx < 0) return null;
    const updated = { ...companies[idx], ...patch, updatedAt: crmNow() };
    companies[idx] = updated;
    return updated;
  },

  async deleteCompany(id, scope) {
    const before = companies.length;
    companies = companies.filter((c) => !(c.id === id && inCrmScope(c, scope)));
    return companies.length < before;
  },

  async listPipelines(scope) {
    return scoped(pipelines, scope);
  },

  async getPipeline(id, scope) {
    const item = pipelines.find((p) => p.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },

  async createPipeline(input, scope) {
    const now = crmNow();
    const stages =
      input.stages && input.stages.length > 0
        ? input.stages.map((s, i) => ({
            id: s.id ?? crmNewId("stage"),
            name: s.name,
            order: s.order ?? i,
            probability: s.probability ?? Math.min(100, (i + 1) * 20),
          }))
        : [
            { id: crmNewId("stage"), name: "New", order: 0, probability: 10 },
            { id: crmNewId("stage"), name: "Qualified", order: 1, probability: 30 },
            { id: crmNewId("stage"), name: "Proposal", order: 2, probability: 60 },
            { id: crmNewId("stage"), name: "Negotiation", order: 3, probability: 80 },
            { id: crmNewId("stage"), name: "Won", order: 4, probability: 100 },
          ];
    const pipeline: CrmPipeline = {
      ...scope,
      id: crmNewId("pipe"),
      name: input.name,
      stages,
      createdAt: now,
      updatedAt: now,
    };
    pipelines = [pipeline, ...pipelines];
    return pipeline;
  },

  async updatePipeline(id, patch, scope) {
    const idx = pipelines.findIndex((p) => p.id === id && inCrmScope(p, scope));
    if (idx < 0) return null;
    const updated = { ...pipelines[idx], ...patch, updatedAt: crmNow() };
    pipelines[idx] = updated;
    return updated;
  },

  async deletePipeline(id, scope) {
    const before = pipelines.length;
    pipelines = pipelines.filter((p) => !(p.id === id && inCrmScope(p, scope)));
    return pipelines.length < before;
  },

  async listDeals(scope, filters) {
    let items = scoped(deals, scope);
    if (filters?.pipelineId) {
      items = items.filter((d) => d.pipelineId === filters.pipelineId);
    }
    if (filters?.contactId) {
      items = items.filter((d) => d.contactId === filters.contactId);
    }
    if (filters?.accountId) {
      items = items.filter((d) => d.accountId === filters.accountId);
    }
    return items.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getDeal(id, scope) {
    const item = deals.find((d) => d.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },

  async createDeal(input, scope) {
    const now = crmNow();
    const deal: CrmDeal = {
      ...scope,
      id: crmNewId("deal"),
      ...input,
      currency: "GBP",
      probability: input.probability ?? 0,
      status: input.status ?? "open",
      createdAt: now,
      updatedAt: now,
    };
    deals = [deal, ...deals];
    return deal;
  },

  async updateDeal(id, patch, scope) {
    const idx = deals.findIndex((d) => d.id === id && inCrmScope(d, scope));
    if (idx < 0) return null;
    const updated = { ...deals[idx], ...patch, updatedAt: crmNow() };
    deals[idx] = updated;
    return updated;
  },

  async deleteDeal(id, scope) {
    const before = deals.length;
    deals = deals.filter((d) => !(d.id === id && inCrmScope(d, scope)));
    return deals.length < before;
  },

  async listTasks(scope, filters) {
    let items = scoped(tasks, scope);
    if (filters?.status) items = items.filter((t) => t.status === filters.status);
    if (filters?.assignedAgentType) {
      items = items.filter((t) => t.assignedAgentType === filters.assignedAgentType);
    }
    if (filters?.assignedTo) {
      items = items.filter((t) => t.assignedTo === filters.assignedTo);
    }
    if (filters?.contactId) {
      items = items.filter((t) => t.contactId === filters.contactId);
    }
    if (filters?.dealId) {
      items = items.filter((t) => t.dealId === filters.dealId);
    }
    return items.sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  },

  async getTask(id, scope) {
    const item = tasks.find((t) => t.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },

  async createTask(input, scope) {
    const now = crmNow();
    const task: CrmTask = {
      ...scope,
      id: crmNewId("task"),
      ...input,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      source: input.source ?? "manual",
      createdAt: now,
      updatedAt: now,
    };
    tasks = [task, ...tasks];
    return task;
  },

  async updateTask(id, patch, scope) {
    const idx = tasks.findIndex((t) => t.id === id && inCrmScope(t, scope));
    if (idx < 0) return null;
    const updated = { ...tasks[idx], ...patch, updatedAt: crmNow() };
    tasks[idx] = updated;
    return updated;
  },

  async deleteTask(id, scope) {
    const before = tasks.length;
    tasks = tasks.filter((t) => !(t.id === id && inCrmScope(t, scope)));
    return tasks.length < before;
  },

  async listActivities(scope, filters) {
    let items = scoped(activities, scope);
    if (filters?.contactId) {
      items = items.filter((a) => a.contactId === filters.contactId);
    }
    if (filters?.accountId) {
      items = items.filter((a) => a.accountId === filters.accountId);
    }
    if (filters?.dealId) {
      items = items.filter((a) => a.dealId === filters.dealId);
    }
    return items.sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
  },

  async createActivity(input, scope) {
    const now = crmNow();
    const activity: CrmActivity = {
      ...scope,
      id: crmNewId("act"),
      ...input,
      occurredAt: input.occurredAt ?? now,
      createdAt: now,
    };
    activities = [activity, ...activities];
    return activity;
  },
};
