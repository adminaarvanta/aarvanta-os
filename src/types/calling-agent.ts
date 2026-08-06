import type { TenantScope } from "@/types/communication";
import type { ContactTag } from "@/types/crm";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "paused"
  | "completed"
  | "cancelled";

export type QueueItemStatus =
  | "pending"
  | "calling"
  | "busy"
  | "failed"
  | "no_answer"
  | "voicemail"
  | "completed"
  | "booked_meeting"
  | "not_interested"
  | "callback_requested"
  | "wrong_number"
  | "skipped";

export type CallOutcome =
  | "meeting_booked"
  | "callback_requested"
  | "no_answer"
  | "voicemail"
  | "wrong_number"
  | "not_interested"
  | "already_using_competitor"
  | "need_follow_up"
  | "bad_timing"
  | "spam"
  | "disconnected"
  | "busy"
  | "failed"
  | "completed";

export type ConversationStageId =
  | "greeting"
  | "permission"
  | "qualification"
  | "objection_handling"
  | "meeting_proposal"
  | "day_select"
  | "slot_select"
  | "booking"
  | "closing"
  | "end_call";

export type ReminderChannel = "email" | "sms" | "whatsapp";
export type ReminderJobStatus = "pending" | "sent" | "failed" | "cancelled";
export type MeetingBookingStatus =
  | "scheduled"
  | "rescheduled"
  | "cancelled"
  | "completed"
  | "no_show";

export interface WorkingHoursWindow {
  dayOfWeek: number; // 0=Sun … 6=Sat
  start: string; // "09:00"
  end: string; // "17:00"
}

export interface RetryPolicy {
  maxRetries: number;
  busyMinutes: number;
  noAnswerHours: number;
  failedMinutes: number;
  voicemailHours: number;
}

export interface CampaignFilters {
  tags?: ContactTag[];
  minLeadScore?: number;
  industries?: string[];
  requirePhone?: boolean;
  accountIds?: string[];
  contactIds?: string[];
}

export interface FlowTransition {
  when: string;
  to: ConversationStageId;
}

export interface FlowStage {
  id: ConversationStageId;
  label: string;
  objective: string;
  samplePrompt?: string;
  transitions: FlowTransition[];
}

export interface VoiceAgentFlowConfig {
  stages: FlowStage[];
  entryStage: ConversationStageId;
}

export interface VoiceAgent extends TenantScope {
  id: string;
  name: string;
  language: string;
  ttsProvider?: string;
  ttsVoice?: string;
  greetingName?: string;
  flowConfig: VoiceAgentFlowConfig;
  createdAt: string;
  updatedAt: string;
}

export interface CallCampaign extends TenantScope {
  id: string;
  name: string;
  description?: string;
  goal: string;
  targetMeetings?: number;
  status: CampaignStatus;
  filters: CampaignFilters;
  voiceAgentId: string;
  workingHours: WorkingHoursWindow[];
  timezone: string;
  dailyCallLimit: number;
  weekendCalling: boolean;
  retryPolicy: RetryPolicy;
  language: string;
  createdBy?: string;
  startedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallQueueItem extends TenantScope {
  id: string;
  campaignId: string;
  contactId: string;
  status: QueueItemStatus;
  attemptCount: number;
  nextAttemptAt: string;
  lastOutcome?: CallOutcome;
  priority: number;
  lastAttemptAt?: string;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallTranscriptTurn {
  role: "assistant" | "user" | "system";
  content: string;
  at?: string;
  stage?: ConversationStageId;
}

export interface QualificationFlags {
  painPoint?: boolean;
  budget?: boolean;
  decisionMaker?: boolean;
  timeline?: boolean;
  interested?: boolean;
  currentSolution?: string;
  companySize?: string;
  urgency?: string;
}

export interface CallSession extends TenantScope {
  id: string;
  queueId?: string;
  campaignId?: string;
  contactId?: string;
  voiceAgentId?: string;
  callSid?: string;
  conversationId?: string;
  status: "ringing" | "in_progress" | "completed" | "failed";
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  transcript: CallTranscriptTurn[];
  summary?: string;
  sentiment?: "positive" | "neutral" | "negative";
  intent?: string;
  intentConfidence?: number;
  recordingUrl?: string;
  recordingSid?: string;
  outcome?: CallOutcome;
  callScore?: number;
  currentStage?: ConversationStageId;
  qualification?: QualificationFlags;
  aiDecisions?: string[];
  crmUpdates?: string[];
  memorySummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingBooking extends TenantScope {
  id: string;
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
  status: MeetingBookingStatus;
  salesRepName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderJob extends TenantScope {
  id: string;
  meetingBookingId: string;
  channel: ReminderChannel;
  scheduledFor: string;
  status: ReminderJobStatus;
  sentAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  busyMinutes: 30,
  noAnswerHours: 24,
  failedMinutes: 15,
  voicemailHours: 24,
};

export const DEFAULT_WORKING_HOURS: WorkingHoursWindow[] = [
  { dayOfWeek: 1, start: "09:00", end: "17:00" },
  { dayOfWeek: 2, start: "09:00", end: "17:00" },
  { dayOfWeek: 3, start: "09:00", end: "17:00" },
  { dayOfWeek: 4, start: "09:00", end: "17:00" },
  { dayOfWeek: 5, start: "09:00", end: "17:00" },
];

export const DEFAULT_FLOW_CONFIG: VoiceAgentFlowConfig = {
  entryStage: "greeting",
  stages: [
    {
      id: "greeting",
      label: "Greeting",
      objective: "Confirm identity and ask if now is a good time.",
      samplePrompt:
        "Hi, this is Ava calling from Aarvanta. Is this a good time for a quick 2-minute conversation?",
      transitions: [
        { when: "yes", to: "permission" },
        { when: "busy", to: "closing" },
        { when: "no", to: "end_call" },
        { when: "wrong_person", to: "end_call" },
      ],
    },
    {
      id: "permission",
      label: "Permission",
      objective: "Share reason for calling without pitching hard.",
      transitions: [
        { when: "continue", to: "qualification" },
        { when: "not_interested", to: "end_call" },
      ],
    },
    {
      id: "qualification",
      label: "Qualification",
      objective: "Capture interest, current solution, size, urgency, decision maker.",
      transitions: [
        { when: "interested", to: "meeting_proposal" },
        { when: "objection", to: "objection_handling" },
        { when: "not_interested", to: "end_call" },
      ],
    },
    {
      id: "objection_handling",
      label: "Objection Handling",
      objective: "Address objections briefly, then re-qualify.",
      transitions: [
        { when: "resolved", to: "meeting_proposal" },
        { when: "not_interested", to: "end_call" },
      ],
    },
    {
      id: "meeting_proposal",
      label: "Meeting Booking",
      objective: "Propose a short strategy session and offer to check times.",
      transitions: [
        { when: "yes", to: "day_select" },
        { when: "no", to: "closing" },
      ],
    },
    {
      id: "day_select",
      label: "Day Select",
      objective: "Offer 2–3 business days with availability.",
      transitions: [{ when: "day_chosen", to: "slot_select" }],
    },
    {
      id: "slot_select",
      label: "Slot Select",
      objective: "Offer two time slots for the chosen day.",
      transitions: [
        { when: "slot_chosen", to: "booking" },
        { when: "neither", to: "slot_select" },
      ],
    },
    {
      id: "booking",
      label: "Booking",
      objective: "Confirm booking details and next steps.",
      transitions: [{ when: "booked", to: "closing" }],
    },
    {
      id: "closing",
      label: "Closing",
      objective: "Thank them and end politely; offer future follow-up if declined.",
      transitions: [{ when: "done", to: "end_call" }],
    },
    {
      id: "end_call",
      label: "End Call",
      objective: "Hang up gracefully.",
      transitions: [],
    },
  ],
};
