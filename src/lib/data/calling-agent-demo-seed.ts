import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import { crmNow } from "@/lib/data/crm-helpers";
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

const now = crmNow();
const agentId = "voice_agent_ava";
const campaignId = "campaign_healthcare_demo";

export const DEMO_VOICE_AGENTS: VoiceAgent[] = [
  {
    ...DEMO_TENANT,
    id: agentId,
    name: "Ava",
    language: "en-US",
    ttsProvider: "ElevenLabs",
    greetingName: "Ava",
    flowConfig: DEFAULT_FLOW_CONFIG,
    createdAt: now,
    updatedAt: now,
  },
];

export const DEMO_CALL_CAMPAIGNS: CallCampaign[] = [
  {
    ...DEMO_TENANT,
    id: campaignId,
    name: "Healthcare Demo Campaign",
    description: "Outbound discovery calls for high-intent prospects.",
    goal: "Book Meetings",
    targetMeetings: 20,
    status: "running",
    filters: {
      tags: ["prospect", "hot_lead"],
      minLeadScore: 50,
      requirePhone: true,
    },
    voiceAgentId: agentId,
    workingHours: DEFAULT_WORKING_HOURS,
    timezone: "America/New_York",
    dailyCallLimit: 40,
    weekendCalling: false,
    retryPolicy: DEFAULT_RETRY_POLICY,
    language: "en-US",
    createdBy: "user_pavan",
    startedAt: now,
    createdAt: now,
    updatedAt: now,
  },
];

export const DEMO_CALL_QUEUE: CallQueueItem[] = [
  {
    ...DEMO_TENANT,
    id: "queue_sarah",
    campaignId,
    contactId: "contact_sarah",
    status: "calling",
    attemptCount: 1,
    nextAttemptAt: now,
    lastAttemptAt: now,
    priority: 10,
    sessionId: "session_live_sarah",
    createdAt: now,
    updatedAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "queue_priya",
    campaignId,
    contactId: "contact_priya",
    status: "pending",
    attemptCount: 0,
    nextAttemptAt: now,
    priority: 8,
    createdAt: now,
    updatedAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "queue_emily",
    campaignId,
    contactId: "contact_emily",
    status: "pending",
    attemptCount: 0,
    nextAttemptAt: now,
    priority: 5,
    createdAt: now,
    updatedAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "queue_james",
    campaignId,
    contactId: "contact_james",
    status: "booked_meeting",
    attemptCount: 1,
    nextAttemptAt: now,
    lastOutcome: "meeting_booked",
    lastAttemptAt: now,
    priority: 3,
    sessionId: "session_james_done",
    createdAt: now,
    updatedAt: now,
  },
];

export const DEMO_CALL_SESSIONS: CallSession[] = [
  {
    ...DEMO_TENANT,
    id: "session_live_sarah",
    queueId: "queue_sarah",
    campaignId,
    contactId: "contact_sarah",
    voiceAgentId: agentId,
    status: "in_progress",
    startedAt: now,
    transcript: [
      {
        role: "assistant",
        content:
          "Hi Sarah, this is Ava calling from Aarvanta. Is this a good time for a quick 2-minute conversation?",
        stage: "greeting",
      },
      {
        role: "user",
        content: "Sure, I have a couple of minutes.",
        stage: "greeting",
      },
      {
        role: "assistant",
        content:
          "Great — we've been helping consulting teams automate customer operations with AI employees. I'd love to see if it could be relevant for Meridian.",
        stage: "permission",
      },
    ],
    currentStage: "qualification",
    intent: "Interested",
    intentConfidence: 0.89,
    qualification: {
      interested: true,
      painPoint: true,
      decisionMaker: true,
    },
    sentiment: "positive",
    createdAt: now,
    updatedAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "session_james_done",
    queueId: "queue_james",
    campaignId,
    contactId: "contact_james",
    voiceAgentId: agentId,
    status: "completed",
    startedAt: new Date(Date.now() - 3600_000).toISOString(),
    endedAt: new Date(Date.now() - 3300_000).toISOString(),
    durationSeconds: 312,
    transcript: [
      {
        role: "assistant",
        content: "Hi James, Ava from Aarvanta — is now a good time?",
        stage: "greeting",
      },
      {
        role: "user",
        content: "Yes, go ahead.",
        stage: "greeting",
      },
      {
        role: "assistant",
        content: "We have 10:30 AM or 2:00 PM tomorrow. Which works better?",
        stage: "slot_select",
      },
      {
        role: "user",
        content: "2:00 PM works.",
        stage: "slot_select",
      },
    ],
    summary:
      "James confirmed interest in AI workforce add-on. Booked discovery call for tomorrow 2:00 PM ET.",
    sentiment: "positive",
    intent: "Interested",
    intentConfidence: 0.94,
    outcome: "meeting_booked",
    callScore: 4.6,
    currentStage: "end_call",
    qualification: {
      interested: true,
      painPoint: true,
      budget: true,
      decisionMaker: true,
      timeline: true,
    },
    aiDecisions: [
      "Advanced past greeting after affirmative",
      "Offered two slots instead of full list",
      "Booked meeting and scheduled reminders",
    ],
    crmUpdates: [
      "Created call activity",
      "Created meeting task",
      "Updated contact last contacted",
    ],
    createdAt: now,
    updatedAt: now,
  },
];

const meetingStart = new Date();
meetingStart.setDate(meetingStart.getDate() + 1);
meetingStart.setHours(14, 0, 0, 0);
const meetingEnd = new Date(meetingStart.getTime() + 20 * 60_000);

export const DEMO_MEETING_BOOKINGS: MeetingBooking[] = [
  {
    ...DEMO_TENANT,
    id: "meeting_james",
    leadId: "contact_james",
    campaignId,
    sessionId: "session_james_done",
    calendarEventId: "gcal_demo_james",
    ownerId: "user_pavan",
    title: "Discovery Call — Northstar Digital",
    meetingStart: meetingStart.toISOString(),
    meetingEnd: meetingEnd.toISOString(),
    timezone: "America/New_York",
    durationMinutes: 20,
    meetLink: "https://meet.google.com/aar-vanta-demo",
    status: "scheduled",
    salesRepName: "Pavan",
    createdAt: now,
    updatedAt: now,
  },
];

export const DEMO_REMINDER_JOBS: ReminderJob[] = [
  {
    ...DEMO_TENANT,
    id: "reminder_james_24h",
    meetingBookingId: "meeting_james",
    channel: "email",
    scheduledFor: new Date(meetingStart.getTime() - 24 * 3600_000).toISOString(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "reminder_james_2h",
    meetingBookingId: "meeting_james",
    channel: "email",
    scheduledFor: new Date(meetingStart.getTime() - 2 * 3600_000).toISOString(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "reminder_james_30m",
    meetingBookingId: "meeting_james",
    channel: "email",
    scheduledFor: new Date(meetingStart.getTime() - 30 * 60_000).toISOString(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  },
];
