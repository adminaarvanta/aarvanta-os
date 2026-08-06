import type { CallingAgentRepository } from "@/lib/data/calling-agent-repository";
import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import {
  DEFAULT_FLOW_CONFIG,
  DEFAULT_RETRY_POLICY,
  DEFAULT_WORKING_HOURS,
  type CallCampaign,
  type CallQueueItem,
  type CallSession,
  type MeetingBooking,
  type ReminderJob,
  type VoiceAgent,
} from "@/types/calling-agent";

const COLLECTIONS = {
  agents: "voice_agents",
  campaigns: "call_campaigns",
  queue: "call_queue",
  sessions: "call_sessions",
  meetings: "meeting_bookings",
  reminders: "reminder_jobs",
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

export const callingAgentFirestoreRepository: CallingAgentRepository = {
  async listAgents(scope) {
    const items = await listScoped<VoiceAgent>(COLLECTIONS.agents, scope);
    return items.sort((a, b) => a.name.localeCompare(b.name));
  },
  async getAgent(id, scope) {
    return getScoped<VoiceAgent>(COLLECTIONS.agents, id, scope);
  },
  async createAgent(input, scope) {
    const now = crmNow();
    const agent: VoiceAgent = {
      ...scope,
      id: crmNewId("voice_agent"),
      name: input.name,
      language: input.language ?? "en-US",
      ttsProvider: input.ttsProvider,
      ttsVoice: input.ttsVoice,
      greetingName: input.greetingName ?? input.name,
      flowConfig: input.flowConfig ?? DEFAULT_FLOW_CONFIG,
      createdAt: now,
      updatedAt: now,
    };
    return save(COLLECTIONS.agents, agent);
  },
  async updateAgent(id, patch, scope) {
    const existing = await getScoped<VoiceAgent>(COLLECTIONS.agents, id, scope);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: crmNow() };
    return save(COLLECTIONS.agents, updated);
  },

  async listCampaigns(scope) {
    const items = await listScoped<CallCampaign>(COLLECTIONS.campaigns, scope);
    return items.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },
  async getCampaign(id, scope) {
    return getScoped<CallCampaign>(COLLECTIONS.campaigns, id, scope);
  },
  async createCampaign(input, scope) {
    const now = crmNow();
    const campaign: CallCampaign = {
      ...scope,
      id: crmNewId("campaign"),
      name: input.name,
      description: input.description,
      goal: input.goal ?? "Book Meetings",
      targetMeetings: input.targetMeetings,
      status: input.status ?? "draft",
      filters: input.filters ?? { requirePhone: true },
      voiceAgentId: input.voiceAgentId,
      workingHours: input.workingHours ?? DEFAULT_WORKING_HOURS,
      timezone: input.timezone ?? "UTC",
      dailyCallLimit: input.dailyCallLimit ?? 40,
      weekendCalling: input.weekendCalling ?? false,
      retryPolicy: input.retryPolicy ?? DEFAULT_RETRY_POLICY,
      language: input.language ?? "en-US",
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    return save(COLLECTIONS.campaigns, campaign);
  },
  async updateCampaign(id, patch, scope) {
    const existing = await getScoped<CallCampaign>(COLLECTIONS.campaigns, id, scope);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: crmNow() };
    return save(COLLECTIONS.campaigns, updated);
  },

  async listQueue(scope, filters) {
    let items = await listScoped<CallQueueItem>(COLLECTIONS.queue, scope);
    if (filters?.campaignId) {
      items = items.filter((q) => q.campaignId === filters.campaignId);
    }
    if (filters?.status) {
      items = items.filter((q) => q.status === filters.status);
    }
    return items.sort((a, b) => b.priority - a.priority);
  },
  async getQueueItem(id, scope) {
    return getScoped<CallQueueItem>(COLLECTIONS.queue, id, scope);
  },
  async createQueueItem(input, scope) {
    const now = crmNow();
    const item: CallQueueItem = {
      ...scope,
      id: crmNewId("queue"),
      campaignId: input.campaignId,
      contactId: input.contactId,
      status: input.status ?? "pending",
      attemptCount: 0,
      nextAttemptAt: input.nextAttemptAt ?? now,
      priority: input.priority ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    return save(COLLECTIONS.queue, item);
  },
  async createQueueItems(inputs, scope) {
    const created = [];
    for (const input of inputs) {
      created.push(await this.createQueueItem(input, scope));
    }
    return created;
  },
  async updateQueueItem(id, patch, scope) {
    const existing = await getScoped<CallQueueItem>(COLLECTIONS.queue, id, scope);
    if (!existing) return null;
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
    const items = snap.docs.map((d) => d.data() as CallQueueItem);
    const campaignIds = [...new Set(items.map((i) => i.campaignId))];
    const running = new Set<string>();
    for (const id of campaignIds) {
      const camp = await db.collection(COLLECTIONS.campaigns).doc(id).get();
      if (camp.exists && (camp.data() as CallCampaign).status === "running") {
        running.add(id);
      }
    }
    return items
      .filter((i) => running.has(i.campaignId))
      .sort(
        (a, b) =>
          b.priority - a.priority || a.nextAttemptAt.localeCompare(b.nextAttemptAt)
      )
      .slice(0, limit);
  },

  async listSessions(scope, filters) {
    let items = await listScoped<CallSession>(COLLECTIONS.sessions, scope);
    if (filters?.campaignId) {
      items = items.filter((s) => s.campaignId === filters.campaignId);
    }
    if (filters?.contactId) {
      items = items.filter((s) => s.contactId === filters.contactId);
    }
    if (filters?.status) {
      items = items.filter((s) => s.status === filters.status);
    }
    return items.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  },
  async getSession(id, scope) {
    return getScoped<CallSession>(COLLECTIONS.sessions, id, scope);
  },
  async getSessionByCallSid(callSid) {
    const snap = await getDb()
      .collection(COLLECTIONS.sessions)
      .where("callSid", "==", callSid)
      .limit(1)
      .get();
    if (snap.empty) return null;
    return snap.docs[0].data() as CallSession;
  },
  async createSession(input, scope) {
    const now = crmNow();
    const session: CallSession = {
      ...scope,
      id: crmNewId("session"),
      queueId: input.queueId,
      campaignId: input.campaignId,
      contactId: input.contactId,
      voiceAgentId: input.voiceAgentId,
      callSid: input.callSid,
      conversationId: input.conversationId,
      status: input.status ?? "ringing",
      startedAt: now,
      transcript: [],
      memorySummary: input.memorySummary,
      createdAt: now,
      updatedAt: now,
    };
    return save(COLLECTIONS.sessions, session);
  },
  async updateSession(id, patch, scope) {
    const existing = await getScoped<CallSession>(COLLECTIONS.sessions, id, scope);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: crmNow() };
    return save(COLLECTIONS.sessions, updated);
  },

  async listMeetings(scope, filters) {
    let items = await listScoped<MeetingBooking>(COLLECTIONS.meetings, scope);
    if (filters?.leadId) items = items.filter((m) => m.leadId === filters.leadId);
    if (filters?.status) items = items.filter((m) => m.status === filters.status);
    return items.sort(
      (a, b) =>
        new Date(a.meetingStart).getTime() - new Date(b.meetingStart).getTime()
    );
  },
  async getMeeting(id, scope) {
    return getScoped<MeetingBooking>(COLLECTIONS.meetings, id, scope);
  },
  async createMeeting(input, scope) {
    const now = crmNow();
    const meeting: MeetingBooking = {
      ...scope,
      id: crmNewId("meeting"),
      leadId: input.leadId,
      campaignId: input.campaignId,
      sessionId: input.sessionId,
      calendarEventId: input.calendarEventId,
      ownerId: input.ownerId,
      title: input.title,
      meetingStart: input.meetingStart,
      meetingEnd: input.meetingEnd,
      timezone: input.timezone,
      durationMinutes: input.durationMinutes,
      meetLink: input.meetLink,
      status: input.status ?? "scheduled",
      salesRepName: input.salesRepName,
      createdAt: now,
      updatedAt: now,
    };
    return save(COLLECTIONS.meetings, meeting);
  },
  async updateMeeting(id, patch, scope) {
    const existing = await getScoped<MeetingBooking>(COLLECTIONS.meetings, id, scope);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: crmNow() };
    return save(COLLECTIONS.meetings, updated);
  },

  async listReminders(scope, filters) {
    let items = await listScoped<ReminderJob>(COLLECTIONS.reminders, scope);
    if (filters?.meetingBookingId) {
      items = items.filter((r) => r.meetingBookingId === filters.meetingBookingId);
    }
    if (filters?.status) items = items.filter((r) => r.status === filters.status);
    return items.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  },
  async createReminder(input, scope) {
    const now = crmNow();
    const reminder: ReminderJob = {
      ...scope,
      id: crmNewId("reminder"),
      meetingBookingId: input.meetingBookingId,
      channel: input.channel,
      scheduledFor: input.scheduledFor,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    return save(COLLECTIONS.reminders, reminder);
  },
  async updateReminder(id, patch, scope) {
    const existing = await getScoped<ReminderJob>(COLLECTIONS.reminders, id, scope);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: crmNow() };
    return save(COLLECTIONS.reminders, updated);
  },
  async listDueReminders(nowIso) {
    const snap = await getDb()
      .collection(COLLECTIONS.reminders)
      .where("status", "==", "pending")
      .where("scheduledFor", "<=", nowIso)
      .get();
    return snap.docs.map((d) => d.data() as ReminderJob);
  },
};
