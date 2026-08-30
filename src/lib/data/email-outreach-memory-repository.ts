import {
  DEMO_EMAIL_CAMPAIGNS,
  DEMO_EMAIL_QUEUE,
} from "@/lib/email-outreach/demo-seed";
import type { EmailOutreachRepository } from "@/lib/data/email-outreach-repository";
import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { TenantScope } from "@/types/communication";
import type { EmailCampaign, EmailSendItem } from "@/types/email-outreach";

type MemoryState = {
  campaigns: EmailCampaign[];
  queue: EmailSendItem[];
};

const globalStore = globalThis as typeof globalThis & {
  __aarvantaEmailOutreach?: MemoryState;
};

function state(): MemoryState {
  if (!globalStore.__aarvantaEmailOutreach) {
    globalStore.__aarvantaEmailOutreach = {
      campaigns: [...DEMO_EMAIL_CAMPAIGNS],
      queue: [...DEMO_EMAIL_QUEUE],
    };
  }
  return globalStore.__aarvantaEmailOutreach;
}

function scoped<T extends TenantScope>(items: T[], scope: TenantScope) {
  return items.filter((item) => inCrmScope(item, scope));
}

export const emailOutreachMemoryRepository: EmailOutreachRepository = {
  async listCampaigns(scope) {
    return scoped(state().campaigns, scope).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },
  async getCampaign(id, scope) {
    const item = state().campaigns.find((c) => c.id === id);
    return item && inCrmScope(item, scope) ? item : null;
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
    const store = state();
    store.campaigns = [campaign, ...store.campaigns];
    return campaign;
  },
  async updateCampaign(id, patch, scope) {
    const store = state();
    const idx = store.campaigns.findIndex((c) => c.id === id && inCrmScope(c, scope));
    if (idx < 0) return null;
    store.campaigns[idx] = {
      ...store.campaigns[idx],
      ...patch,
      updatedAt: crmNow(),
    };
    return store.campaigns[idx];
  },

  async listQueue(scope, filters) {
    let items = scoped(state().queue, scope);
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
    const item = state().queue.find((q) => q.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },
  async getQueueItemByMessageId(messageId) {
    return state().queue.find((q) => q.brevoMessageId === messageId) ?? null;
  },
  async createQueueItems(inputs, scope) {
    const now = crmNow();
    const created: EmailSendItem[] = inputs.map((input) => ({
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
    }));
    const store = state();
    store.queue = [...created, ...store.queue];
    return created;
  },
  async updateQueueItem(id, patch, scope) {
    const store = state();
    const idx = store.queue.findIndex(
      (q) => q.id === id && (!scope || inCrmScope(q, scope))
    );
    if (idx < 0) return null;
    store.queue[idx] = { ...store.queue[idx], ...patch, updatedAt: crmNow() };
    return store.queue[idx];
  },
  async listDueQueueItems(nowIso, limit = 20) {
    const store = state();
    return store.queue
      .filter(
        (q) =>
          q.status === "pending" &&
          q.nextAttemptAt <= nowIso &&
          store.campaigns.some((c) => c.id === q.campaignId && c.status === "running")
      )
      .sort((a, b) => a.nextAttemptAt.localeCompare(b.nextAttemptAt))
      .slice(0, limit);
  },
};
