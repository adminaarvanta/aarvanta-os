import {
  DEMO_CALL_CAMPAIGNS,
  DEMO_CALL_QUEUE,
  DEMO_CALL_SESSIONS,
  DEMO_MEETING_BOOKINGS,
  DEMO_REMINDER_JOBS,
  DEMO_VOICE_AGENTS,
} from "@/lib/data/calling-agent-demo-seed";
import type { CallingAgentRepository } from "@/lib/data/calling-agent-repository";
import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
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

let agents = [...DEMO_VOICE_AGENTS];
let campaigns = [...DEMO_CALL_CAMPAIGNS];
let queue = [...DEMO_CALL_QUEUE];
let sessions = [...DEMO_CALL_SESSIONS];
let meetings = [...DEMO_MEETING_BOOKINGS];
let reminders = [...DEMO_REMINDER_JOBS];

function scoped<T extends TenantScope>(items: T[], scope: TenantScope) {
  return items.filter((item) => inCrmScope(item, scope));
}

export const callingAgentMemoryRepository: CallingAgentRepository = {
  async listAgents(scope) {
    return scoped(agents, scope).sort((a, b) => a.name.localeCompare(b.name));
  },
  async getAgent(id, scope) {
    const item = agents.find((a) => a.id === id);
    return item && inCrmScope(item, scope) ? item : null;
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
    agents = [agent, ...agents];
    return agent;
  },
  async updateAgent(id, patch, scope) {
    const idx = agents.findIndex((a) => a.id === id && inCrmScope(a, scope));
    if (idx < 0) return null;
    agents[idx] = { ...agents[idx], ...patch, updatedAt: crmNow() };
    return agents[idx];
  },

  async listCampaigns(scope) {
    return scoped(campaigns, scope).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },
  async getCampaign(id, scope) {
    const item = campaigns.find((c) => c.id === id);
    return item && inCrmScope(item, scope) ? item : null;
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
    campaigns = [campaign, ...campaigns];
    return campaign;
  },
  async updateCampaign(id, patch, scope) {
    const idx = campaigns.findIndex((c) => c.id === id && inCrmScope(c, scope));
    if (idx < 0) return null;
    campaigns[idx] = { ...campaigns[idx], ...patch, updatedAt: crmNow() };
    return campaigns[idx];
  },

  async listQueue(scope, filters) {
    let items = scoped(queue, scope);
    if (filters?.campaignId) {
      items = items.filter((q) => q.campaignId === filters.campaignId);
    }
    if (filters?.status) {
      items = items.filter((q) => q.status === filters.status);
    }
    return items.sort((a, b) => b.priority - a.priority);
  },
  async getQueueItem(id, scope) {
    const item = queue.find((q) => q.id === id);
    return item && inCrmScope(item, scope) ? item : null;
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
    queue = [item, ...queue];
    return item;
  },
  async createQueueItems(inputs, scope) {
    const created = [];
    for (const input of inputs) {
      created.push(await this.createQueueItem(input, scope));
    }
    return created;
  },
  async updateQueueItem(id, patch, scope) {
    const idx = queue.findIndex((q) => q.id === id && inCrmScope(q, scope));
    if (idx < 0) return null;
    queue[idx] = { ...queue[idx], ...patch, updatedAt: crmNow() };
    return queue[idx];
  },
  async listDueQueueItems(nowIso, limit = 20) {
    return queue
      .filter(
        (q) =>
          q.status === "pending" &&
          q.nextAttemptAt <= nowIso &&
          campaigns.some((c) => c.id === q.campaignId && c.status === "running")
      )
      .sort((a, b) => b.priority - a.priority || a.nextAttemptAt.localeCompare(b.nextAttemptAt))
      .slice(0, limit);
  },

  async listSessions(scope, filters) {
    let items = scoped(sessions, scope);
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
    const item = sessions.find((s) => s.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },
  async getSessionByCallSid(callSid) {
    return sessions.find((s) => s.callSid === callSid) ?? null;
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
    sessions = [session, ...sessions];
    return session;
  },
  async updateSession(id, patch, scope) {
    const idx = sessions.findIndex((s) => s.id === id && inCrmScope(s, scope));
    if (idx < 0) return null;
    sessions[idx] = { ...sessions[idx], ...patch, updatedAt: crmNow() };
    return sessions[idx];
  },

  async listMeetings(scope, filters) {
    let items = scoped(meetings, scope);
    if (filters?.leadId) items = items.filter((m) => m.leadId === filters.leadId);
    if (filters?.status) items = items.filter((m) => m.status === filters.status);
    return items.sort(
      (a, b) =>
        new Date(a.meetingStart).getTime() - new Date(b.meetingStart).getTime()
    );
  },
  async getMeeting(id, scope) {
    const item = meetings.find((m) => m.id === id);
    return item && inCrmScope(item, scope) ? item : null;
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
    meetings = [meeting, ...meetings];
    return meeting;
  },
  async updateMeeting(id, patch, scope) {
    const idx = meetings.findIndex((m) => m.id === id && inCrmScope(m, scope));
    if (idx < 0) return null;
    meetings[idx] = { ...meetings[idx], ...patch, updatedAt: crmNow() };
    return meetings[idx];
  },

  async listReminders(scope, filters) {
    let items = scoped(reminders, scope);
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
    reminders = [reminder, ...reminders];
    return reminder;
  },
  async updateReminder(id, patch, scope) {
    const idx = reminders.findIndex((r) => r.id === id && inCrmScope(r, scope));
    if (idx < 0) return null;
    reminders[idx] = { ...reminders[idx], ...patch, updatedAt: crmNow() };
    return reminders[idx];
  },
  async listDueReminders(nowIso) {
    return reminders.filter(
      (r) => r.status === "pending" && r.scheduledFor <= nowIso
    );
  },
};
