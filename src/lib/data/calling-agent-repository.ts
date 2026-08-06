import type { TenantScope } from "@/types/communication";
import type {
  CallCampaign,
  CallOutcome,
  CallQueueItem,
  CallSession,
  CampaignFilters,
  CampaignStatus,
  MeetingBooking,
  MeetingBookingStatus,
  QueueItemStatus,
  ReminderJob,
  ReminderJobStatus,
  RetryPolicy,
  VoiceAgent,
  VoiceAgentFlowConfig,
  WorkingHoursWindow,
} from "@/types/calling-agent";

export type CreateVoiceAgentInput = {
  name: string;
  language?: string;
  ttsProvider?: string;
  ttsVoice?: string;
  greetingName?: string;
  flowConfig?: VoiceAgentFlowConfig;
};

export type CreateCampaignInput = {
  name: string;
  description?: string;
  goal?: string;
  targetMeetings?: number;
  filters?: CampaignFilters;
  voiceAgentId: string;
  workingHours?: WorkingHoursWindow[];
  timezone?: string;
  dailyCallLimit?: number;
  weekendCalling?: boolean;
  retryPolicy?: RetryPolicy;
  language?: string;
  status?: CampaignStatus;
  createdBy?: string;
};

export type CreateQueueItemInput = {
  campaignId: string;
  contactId: string;
  status?: QueueItemStatus;
  priority?: number;
  nextAttemptAt?: string;
};

export type CreateSessionInput = {
  queueId?: string;
  campaignId?: string;
  contactId?: string;
  voiceAgentId?: string;
  callSid?: string;
  conversationId?: string;
  status?: CallSession["status"];
  memorySummary?: string;
};

export type CreateMeetingInput = {
  leadId: string;
  campaignId?: string;
  sessionId?: string;
  calendarEventId?: string;
  ownerId?: string;
  title: string;
  meetingStart: string;
  meetingEnd: string;
  timezone: string;
  durationMinutes: number;
  meetLink?: string;
  salesRepName?: string;
  status?: MeetingBookingStatus;
};

export type CreateReminderInput = {
  meetingBookingId: string;
  channel: ReminderJob["channel"];
  scheduledFor: string;
};

export interface CallingAgentRepository {
  listAgents(scope: TenantScope): Promise<VoiceAgent[]>;
  getAgent(id: string, scope: TenantScope): Promise<VoiceAgent | null>;
  createAgent(input: CreateVoiceAgentInput, scope: TenantScope): Promise<VoiceAgent>;
  updateAgent(
    id: string,
    patch: Partial<
      Pick<
        VoiceAgent,
        | "name"
        | "language"
        | "ttsProvider"
        | "ttsVoice"
        | "greetingName"
        | "flowConfig"
      >
    >,
    scope: TenantScope
  ): Promise<VoiceAgent | null>;

  listCampaigns(scope: TenantScope): Promise<CallCampaign[]>;
  getCampaign(id: string, scope: TenantScope): Promise<CallCampaign | null>;
  createCampaign(input: CreateCampaignInput, scope: TenantScope): Promise<CallCampaign>;
  updateCampaign(
    id: string,
    patch: Partial<
      Pick<
        CallCampaign,
        | "name"
        | "description"
        | "goal"
        | "targetMeetings"
        | "status"
        | "filters"
        | "voiceAgentId"
        | "workingHours"
        | "timezone"
        | "dailyCallLimit"
        | "weekendCalling"
        | "retryPolicy"
        | "language"
        | "startedAt"
      >
    >,
    scope: TenantScope
  ): Promise<CallCampaign | null>;

  listQueue(
    scope: TenantScope,
    filters?: { campaignId?: string; status?: QueueItemStatus }
  ): Promise<CallQueueItem[]>;
  getQueueItem(id: string, scope: TenantScope): Promise<CallQueueItem | null>;
  createQueueItem(
    input: CreateQueueItemInput,
    scope: TenantScope
  ): Promise<CallQueueItem>;
  createQueueItems(
    inputs: CreateQueueItemInput[],
    scope: TenantScope
  ): Promise<CallQueueItem[]>;
  updateQueueItem(
    id: string,
    patch: Partial<
      Pick<
        CallQueueItem,
        | "status"
        | "attemptCount"
        | "nextAttemptAt"
        | "lastOutcome"
        | "priority"
        | "lastAttemptAt"
        | "sessionId"
      >
    >,
    scope: TenantScope
  ): Promise<CallQueueItem | null>;
  listDueQueueItems(nowIso: string, limit?: number): Promise<CallQueueItem[]>;

  listSessions(
    scope: TenantScope,
    filters?: {
      campaignId?: string;
      contactId?: string;
      status?: CallSession["status"];
    }
  ): Promise<CallSession[]>;
  getSession(id: string, scope: TenantScope): Promise<CallSession | null>;
  getSessionByCallSid(
    callSid: string,
    scope?: TenantScope
  ): Promise<CallSession | null>;
  createSession(input: CreateSessionInput, scope: TenantScope): Promise<CallSession>;
  updateSession(
    id: string,
    patch: Partial<
      Omit<CallSession, "id" | "tenantId" | "workspaceId" | "companyId" | "createdAt">
    >,
    scope: TenantScope
  ): Promise<CallSession | null>;

  listMeetings(
    scope: TenantScope,
    filters?: { leadId?: string; status?: MeetingBookingStatus }
  ): Promise<MeetingBooking[]>;
  getMeeting(id: string, scope: TenantScope): Promise<MeetingBooking | null>;
  createMeeting(input: CreateMeetingInput, scope: TenantScope): Promise<MeetingBooking>;
  updateMeeting(
    id: string,
    patch: Partial<
      Pick<
        MeetingBooking,
        | "calendarEventId"
        | "meetingStart"
        | "meetingEnd"
        | "timezone"
        | "durationMinutes"
        | "meetLink"
        | "status"
        | "title"
        | "salesRepName"
        | "ownerId"
      >
    >,
    scope: TenantScope
  ): Promise<MeetingBooking | null>;

  listReminders(
    scope: TenantScope,
    filters?: { meetingBookingId?: string; status?: ReminderJobStatus }
  ): Promise<ReminderJob[]>;
  createReminder(input: CreateReminderInput, scope: TenantScope): Promise<ReminderJob>;
  updateReminder(
    id: string,
    patch: Partial<Pick<ReminderJob, "status" | "sentAt" | "error" | "scheduledFor">>,
    scope: TenantScope
  ): Promise<ReminderJob | null>;
  listDueReminders(nowIso: string): Promise<ReminderJob[]>;
}

export type { CallOutcome };
