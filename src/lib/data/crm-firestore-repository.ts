import {
  crmNewId,
  crmNow,
  inCrmScope,
  sumPurchases,
} from "@/lib/data/crm-helpers";
import type { CrmRepository } from "@/lib/data/crm-repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import type {
  CrmActivity,
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmPipeline,
  CrmTask,
} from "@/types/crm";

const COLLECTIONS = {
  contacts: "crm_contacts",
  companies: "crm_companies",
  pipelines: "crm_pipelines",
  deals: "crm_deals",
  tasks: "crm_tasks",
  activities: "crm_activities",
} as const;

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

async function listScoped<T extends TenantScope>(
  collection: string,
  scope: TenantScope
): Promise<T[]> {
  const snap = await getDb()
    .collection(collection)
    .where("tenantId", "==", scope.tenantId)
    .where("workspaceId", "==", scope.workspaceId)
    .where("companyId", "==", scope.companyId)
    .get();
  return snap.docs.map((doc) => doc.data() as T);
}

async function getScoped<T extends TenantScope>(
  collection: string,
  id: string,
  scope: TenantScope
): Promise<T | null> {
  const snap = await getDb().collection(collection).doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() as T;
  return inCrmScope(data, scope) ? data : null;
}

async function save<T extends { id: string }>(collection: string, record: T) {
  await getDb().collection(collection).doc(record.id).set(record);
  return record;
}

export const crmFirestoreRepository: CrmRepository = {
  async listContacts(scope) {
    const items = await listScoped<CrmContact>(COLLECTIONS.contacts, scope);
    return items.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getContact(id, scope) {
    return getScoped<CrmContact>(COLLECTIONS.contacts, id, scope);
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
    return save(COLLECTIONS.contacts, contact);
  },

  async updateContact(id, patch, scope) {
    const existing = await getScoped<CrmContact>(COLLECTIONS.contacts, id, scope);
    if (!existing) return null;
    const updated: CrmContact = {
      ...existing,
      ...patch,
      updatedAt: crmNow(),
    };
    if (patch.purchases) {
      updated.purchaseTotal = sumPurchases(patch.purchases);
    }
    return save(COLLECTIONS.contacts, updated);
  },

  async listCompanies(scope) {
    const items = await listScoped<CrmCompany>(COLLECTIONS.companies, scope);
    return items.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getCompany(id, scope) {
    return getScoped<CrmCompany>(COLLECTIONS.companies, id, scope);
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
    return save(COLLECTIONS.companies, company);
  },

  async updateCompany(id, patch, scope) {
    const existing = await getScoped<CrmCompany>(COLLECTIONS.companies, id, scope);
    if (!existing) return null;
    return save(COLLECTIONS.companies, {
      ...existing,
      ...patch,
      updatedAt: crmNow(),
    });
  },

  async listPipelines(scope) {
    return listScoped<CrmPipeline>(COLLECTIONS.pipelines, scope);
  },

  async getPipeline(id, scope) {
    return getScoped<CrmPipeline>(COLLECTIONS.pipelines, id, scope);
  },

  async listDeals(scope, pipelineId) {
    let items = await listScoped<CrmDeal>(COLLECTIONS.deals, scope);
    if (pipelineId) items = items.filter((d) => d.pipelineId === pipelineId);
    return items.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getDeal(id, scope) {
    return getScoped<CrmDeal>(COLLECTIONS.deals, id, scope);
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
    return save(COLLECTIONS.deals, deal);
  },

  async updateDeal(id, patch, scope) {
    const existing = await getScoped<CrmDeal>(COLLECTIONS.deals, id, scope);
    if (!existing) return null;
    return save(COLLECTIONS.deals, {
      ...existing,
      ...patch,
      updatedAt: crmNow(),
    });
  },

  async listTasks(scope, filters) {
    let items = await listScoped<CrmTask>(COLLECTIONS.tasks, scope);
    if (filters?.status) items = items.filter((t) => t.status === filters.status);
    return items.sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  },

  async getTask(id, scope) {
    return getScoped<CrmTask>(COLLECTIONS.tasks, id, scope);
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
    return save(COLLECTIONS.tasks, task);
  },

  async updateTask(id, patch, scope) {
    const existing = await getScoped<CrmTask>(COLLECTIONS.tasks, id, scope);
    if (!existing) return null;
    return save(COLLECTIONS.tasks, {
      ...existing,
      ...patch,
      updatedAt: crmNow(),
    });
  },

  async listActivities(scope, filters) {
    let items = await listScoped<CrmActivity>(COLLECTIONS.activities, scope);
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
    return save(COLLECTIONS.activities, activity);
  },
};
