import type { EmailOutreachRepository } from "@/lib/data/email-outreach-repository";
import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import type {
  EmailCampaign,
  EmailOutreachTemplate,
  EmailSendItem,
} from "@/types/email-outreach";

const COLLECTIONS = {
  campaigns: "email_campaigns",
  queue: "email_send_queue",
  templates: "email_outreach_templates",
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

export const emailOutreachFirestoreRepository: EmailOutreachRepository = {
  async listCampaigns(scope) {
    const items = await listScoped<EmailCampaign>(COLLECTIONS.campaigns, scope);
    return items.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },
  async getCampaign(id, scope) {
    return getScoped<EmailCampaign>(COLLECTIONS.campaigns, id, scope);
  },
  async createCampaign(input, scope) {
    const now = crmNow();
    const campaign: EmailCampaign = {
      ...scope,
      id: crmNewId("emc"),
      name: input.name,
      description: input.description,
      subject: input.subject,
      previewText: input.previewText,
      htmlBody: input.htmlBody,
      textBody: input.textBody,
      fromName: input.fromName,
      fromEmail: input.fromEmail,
      replyTo: input.replyTo,
      filters: input.filters ?? {},
      status: input.status ?? "draft",
      dailySendLimit: input.dailySendLimit ?? 50,
      scheduledAt: input.scheduledAt,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    return save(COLLECTIONS.campaigns, campaign);
  },
  async updateCampaign(id, patch, scope) {
    const existing = await getScoped<EmailCampaign>(
      COLLECTIONS.campaigns,
      id,
      scope
    );
    if (!existing) return null;
    return save(COLLECTIONS.campaigns, {
      ...existing,
      ...patch,
      updatedAt: crmNow(),
    });
  },

  async listTemplates(scope) {
    const items = await listScoped<EmailOutreachTemplate>(
      COLLECTIONS.templates,
      scope
    );
    return items.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },
  async getTemplate(id, scope) {
    return getScoped<EmailOutreachTemplate>(COLLECTIONS.templates, id, scope);
  },
  async createTemplate(input, scope) {
    const now = crmNow();
    const template: EmailOutreachTemplate = {
      ...scope,
      id: crmNewId("emt"),
      name: input.name,
      description: input.description,
      subject: input.subject,
      previewText: input.previewText,
      htmlBody: input.htmlBody,
      textBody: input.textBody,
      source: input.source ?? "user",
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    return save(COLLECTIONS.templates, template);
  },
  async deleteTemplate(id, scope) {
    const existing = await getScoped<EmailOutreachTemplate>(
      COLLECTIONS.templates,
      id,
      scope
    );
    if (!existing) return false;
    await getDb().collection(COLLECTIONS.templates).doc(id).delete();
    return true;
  },

  async listQueue(scope, filters) {
    let items = await listScoped<EmailSendItem>(COLLECTIONS.queue, scope);
    if (filters?.campaignId) {
      items = items.filter((i) => i.campaignId === filters.campaignId);
    }
    if (filters?.status) {
      items = items.filter((i) => i.status === filters.status);
    }
    return items.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },
  async getQueueItem(id, scope) {
    return getScoped<EmailSendItem>(COLLECTIONS.queue, id, scope);
  },
  async getQueueItemByMessageId(messageId) {
    const snap = await getDb()
      .collection(COLLECTIONS.queue)
      .where("brevoMessageId", "==", messageId)
      .limit(1)
      .get();
    if (snap.empty) return null;
    return snap.docs[0].data() as EmailSendItem;
  },
  async createQueueItems(inputs, scope) {
    const now = crmNow();
    const created: EmailSendItem[] = [];
    for (const input of inputs) {
      const item: EmailSendItem = {
        ...scope,
        id: crmNewId("ems"),
        campaignId: input.campaignId,
        contactId: input.contactId,
        toEmail: input.toEmail,
        toName: input.toName,
        status: input.status ?? "pending",
        subject: input.subject,
        attemptCount: 0,
        nextAttemptAt: input.nextAttemptAt ?? now,
        createdAt: now,
        updatedAt: now,
      };
      await save(COLLECTIONS.queue, item);
      created.push(item);
    }
    return created;
  },
  async updateQueueItem(id, patch, scope) {
    const db = getDb();
    const snap = await db.collection(COLLECTIONS.queue).doc(id).get();
    if (!snap.exists) return null;
    const existing = snap.data() as EmailSendItem;
    if (scope && !inCrmScope(existing, scope)) return null;
    const updated = { ...existing, ...patch, updatedAt: crmNow() };
    return save(COLLECTIONS.queue, updated);
  },
  async listDueQueueItems(nowIso, limit = 20) {
    const db = getDb();
    const snap = await db
      .collection(COLLECTIONS.queue)
      .where("status", "==", "pending")
      .where("nextAttemptAt", "<=", nowIso)
      .limit(limit * 3)
      .get();
    const items = snap.docs.map((d) => d.data() as EmailSendItem);
    const campaignIds = [...new Set(items.map((i) => i.campaignId))];
    const running = new Set<string>();
    for (const id of campaignIds) {
      const camp = await db.collection(COLLECTIONS.campaigns).doc(id).get();
      if (camp.exists && (camp.data() as EmailCampaign).status === "running") {
        running.add(id);
      }
    }
    return items
      .filter((i) => running.has(i.campaignId))
      .sort((a, b) => a.nextAttemptAt.localeCompare(b.nextAttemptAt))
      .slice(0, limit);
  },
};
