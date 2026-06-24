/** Multi-tenant scope — required on all persisted records per PRD */
export interface TenantScope {
  tenantId: string;
  workspaceId: string;
  companyId: string;
}

export type Channel =
  | "whatsapp"
  | "email"
  | "voice"
  | "sms"
  | "website_chat";

export type ConversationTag =
  | "hot_lead"
  | "vip"
  | "follow_up"
  | "support"
  | "lost";

export type Sentiment = "positive" | "neutral" | "frustrated" | "urgent";

export type ConversationIntent = "sales" | "support" | "spam" | "other";

export type TimelineEventType =
  | "message"
  | "call"
  | "email"
  | "note"
  | "meeting";

export interface ContactRef {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  chatSessionId?: string;
}

interface TimelineBase {
  id: string;
  type: TimelineEventType;
  occurredAt: string;
  authorId?: string;
  authorName?: string;
}

export interface TimelineMessage extends TimelineBase {
  type: "message";
  direction: "inbound" | "outbound";
  channel: Channel;
  content: string;
  isAiGenerated?: boolean;
}

export interface TimelineCall extends TimelineBase {
  type: "call";
  direction: "inbound" | "outbound";
  durationSeconds: number;
  summary?: string;
  recordingUrl?: string;
}

export interface TimelineEmail extends TimelineBase {
  type: "email";
  direction: "inbound" | "outbound";
  subject: string;
  bodyPreview: string;
  /** RFC Message-ID for email threading */
  messageId?: string;
  /** Provider id (e.g. Resend send/receive id) */
  providerId?: string;
}

export interface TimelineNote extends TimelineBase {
  type: "note";
  content: string;
  isInternal: boolean;
}

export interface TimelineMeeting extends TimelineBase {
  type: "meeting";
  title: string;
  durationMinutes: number;
  status: "scheduled" | "completed" | "cancelled";
}

export type TimelineEvent =
  | TimelineMessage
  | TimelineCall
  | TimelineEmail
  | TimelineNote
  | TimelineMeeting;

export interface Conversation extends TenantScope {
  id: string;
  contact: ContactRef;
  channels: Channel[];
  tags: ConversationTag[];
  sentiment: Sentiment;
  aiSummary?: string;
  aiSummaryUpdatedAt?: string;
  aiIntent?: ConversationIntent;
  aiQualificationScore?: number;
  unreadCount: number;
  lastActivityAt: string;
  assignedTo?: string;
  /** Set on list views when the full timeline is omitted. */
  timelineEventCount?: number;
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export type CreateMessageInput = {
  content: string;
  channel: Channel;
  subject?: string;
};

export type CreateNoteInput = {
  content: string;
};
