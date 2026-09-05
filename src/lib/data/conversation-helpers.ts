import { persistWorkspaceScope } from "@/lib/data/crm-helpers";
import type {
  Channel,
  ContactRef,
  Conversation,
  TenantScope,
  TimelineCall,
  TimelineEmail,
  TimelineMessage,
} from "@/types/communication";

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").replace(/^\+/, "");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function inScope(c: Conversation, scope: TenantScope) {
  return (
    c.tenantId === scope.tenantId &&
    c.workspaceId === scope.workspaceId &&
    c.companyId === scope.companyId
  );
}

export function withChannel(channels: Channel[], channel: Channel): Channel[] {
  return channels.includes(channel) ? channels : [...channels, channel];
}

function optionalAuthor(author?: { name: string; id?: string }) {
  return author?.id ? { authorId: author.id } : {};
}

function optionalEmailIds(input: { messageId?: string; providerId?: string }) {
  return {
    ...(input.messageId ? { messageId: input.messageId } : {}),
    ...(input.providerId ? { providerId: input.providerId } : {}),
  };
}

export function appendOutboundMessage(
  conv: Conversation,
  input: { channel: Channel; content: string },
  author?: { name: string; id?: string }
): Conversation {
  const now = new Date().toISOString();
  const message: TimelineMessage = {
    id: newId("evt"),
    type: "message",
    direction: "outbound",
    channel: input.channel,
    content: input.content,
    occurredAt: now,
    authorName: author?.name ?? "You",
    ...optionalAuthor(author),
  };

  return {
    ...conv,
    channels: withChannel(conv.channels, input.channel),
    timeline: [...conv.timeline, message],
    lastActivityAt: now,
    updatedAt: now,
    unreadCount: 0,
  };
}

export function appendOutboundEmail(
  conv: Conversation,
  input: { subject: string; content: string; messageId?: string; providerId?: string },
  author?: { name: string; id?: string }
): Conversation {
  const now = new Date().toISOString();
  const email: TimelineEmail = {
    id: newId("evt"),
    type: "email",
    direction: "outbound",
    subject: input.subject,
    bodyPreview: input.content,
    occurredAt: now,
    authorName: author?.name ?? "You",
    ...optionalAuthor(author),
    ...optionalEmailIds(input),
  };

  return {
    ...conv,
    channels: withChannel(conv.channels, "email"),
    timeline: [...conv.timeline, email],
    lastActivityAt: now,
    updatedAt: now,
    unreadCount: 0,
  };
}

export function appendOutboundCall(
  conv: Conversation,
  input: {
    summary: string;
    durationSeconds?: number;
    recordingUrl?: string;
    recordingSid?: string;
    callSid?: string;
  },
  author?: { name: string; id?: string }
): Conversation {
  const now = new Date().toISOString();
  const call: TimelineCall = {
    id: newId("evt"),
    type: "call",
    direction: "outbound",
    durationSeconds: input.durationSeconds ?? 0,
    summary: input.summary,
    recordingUrl: input.recordingUrl,
    recordingSid: input.recordingSid,
    callSid: input.callSid,
    occurredAt: now,
    authorName: author?.name ?? "You",
    ...optionalAuthor(author),
  };

  return {
    ...conv,
    channels: withChannel(conv.channels, "voice"),
    timeline: [...conv.timeline, call],
    lastActivityAt: now,
    updatedAt: now,
    unreadCount: 0,
  };
}

export function appendInboundMessage(
  conv: Conversation,
  input: {
    channel: Channel;
    content: string;
    authorName: string;
  }
): Conversation {
  const now = new Date().toISOString();
  const message: TimelineMessage = {
    id: newId("evt"),
    type: "message",
    direction: "inbound",
    channel: input.channel,
    content: input.content,
    occurredAt: now,
    authorName: input.authorName,
  };

  return {
    ...conv,
    channels: withChannel(conv.channels, input.channel),
    timeline: [...conv.timeline, message],
    lastActivityAt: now,
    updatedAt: now,
    unreadCount: conv.unreadCount + 1,
  };
}

export function appendInboundEmail(
  conv: Conversation,
  input: {
    subject: string;
    body: string;
    authorName: string;
    messageId?: string;
    providerId?: string;
  }
): Conversation {
  const now = new Date().toISOString();
  const email: TimelineEmail = {
    id: newId("evt"),
    type: "email",
    direction: "inbound",
    subject: input.subject,
    bodyPreview: input.body,
    occurredAt: now,
    authorName: input.authorName,
    ...optionalEmailIds(input),
  };

  return {
    ...conv,
    channels: withChannel(conv.channels, "email"),
    timeline: [...conv.timeline, email],
    lastActivityAt: now,
    updatedAt: now,
    unreadCount: conv.unreadCount + 1,
  };
}

export function appendInboundCall(
  conv: Conversation,
  input: {
    durationSeconds: number;
    summary?: string;
    recordingUrl?: string;
    recordingSid?: string;
    callSid?: string;
    authorName: string;
    direction?: "inbound" | "outbound";
  }
): Conversation {
  const now = new Date().toISOString();
  const call: TimelineCall = {
    id: newId("evt"),
    type: "call",
    direction: input.direction ?? "inbound",
    durationSeconds: input.durationSeconds,
    summary: input.summary,
    recordingUrl: input.recordingUrl,
    recordingSid: input.recordingSid,
    callSid: input.callSid,
    occurredAt: now,
    authorName: input.authorName,
  };

  return {
    ...conv,
    channels: withChannel(conv.channels, "voice"),
    timeline: [...conv.timeline, call],
    lastActivityAt: now,
    updatedAt: now,
    unreadCount: conv.unreadCount + 1,
  };
}

/** Attach recording metadata to the matching (or latest) call event. */
export function attachCallRecording(
  conv: Conversation,
  input: {
    recordingUrl: string;
    recordingSid?: string;
    callSid?: string;
  }
): Conversation {
  const now = new Date().toISOString();
  const timeline = [...conv.timeline];
  let idx = -1;
  if (input.callSid) {
    idx = timeline.findIndex(
      (e) => e.type === "call" && e.callSid === input.callSid
    );
  }
  if (idx < 0) {
    for (let i = timeline.length - 1; i >= 0; i--) {
      if (timeline[i]?.type === "call") {
        idx = i;
        break;
      }
    }
  }
  if (idx < 0) return conv;

  const event = timeline[idx];
  if (!event || event.type !== "call") return conv;
  timeline[idx] = {
    ...event,
    recordingUrl: input.recordingUrl,
    recordingSid: input.recordingSid ?? event.recordingSid,
    callSid: input.callSid ?? event.callSid,
  };

  return {
    ...conv,
    timeline,
    updatedAt: now,
  };
}

/** Patch an existing timeline call by CallSid (avoids duplicate outbound events). */
export function patchTimelineCallBySid(
  conv: Conversation,
  callSid: string,
  patch: {
    durationSeconds?: number;
    summary?: string;
    recordingUrl?: string;
    recordingSid?: string;
  }
): Conversation | null {
  const idx = conv.timeline.findIndex(
    (e) => e.type === "call" && e.callSid === callSid
  );
  if (idx < 0) return null;
  const event = conv.timeline[idx];
  if (!event || event.type !== "call") return null;
  const now = new Date().toISOString();
  const timeline = [...conv.timeline];
  timeline[idx] = {
    ...event,
    durationSeconds: patch.durationSeconds ?? event.durationSeconds,
    summary: patch.summary ?? event.summary,
    recordingUrl: patch.recordingUrl ?? event.recordingUrl,
    recordingSid: patch.recordingSid ?? event.recordingSid,
  };
  return {
    ...conv,
    timeline,
    lastActivityAt: now,
    updatedAt: now,
  };
}

export function createConversation(
  scope: TenantScope,
  contact: ContactRef,
  channel: Channel,
  timeline: Conversation["timeline"]
): Conversation {
  const now = new Date().toISOString();
  return {
    ...persistWorkspaceScope(scope),
    id: newId("conv"),
    contact,
    channels: [channel],
    tags: [],
    sentiment: "neutral",
    unreadCount: timeline.length > 0 ? 1 : 0,
    lastActivityAt: now,
    createdAt: now,
    updatedAt: now,
    timeline,
  };
}

/** Drop WhatsApp channel + WhatsApp messages. Returns null when the thread should be deleted. */
export function stripWhatsAppHistory(
  conv: Conversation
): Conversation | null {
  const timeline = conv.timeline.filter(
    (event) => !(event.type === "message" && event.channel === "whatsapp")
  );
  const channels = conv.channels.filter((channel) => channel !== "whatsapp");
  const hadWhatsApp =
    conv.channels.includes("whatsapp") ||
    conv.timeline.some(
      (event) => event.type === "message" && event.channel === "whatsapp"
    );
  if (!hadWhatsApp) return conv;
  if (channels.length === 0 && timeline.length === 0) return null;

  const last = timeline[timeline.length - 1];
  return {
    ...conv,
    channels,
    timeline,
    unreadCount: 0,
    lastActivityAt: last?.occurredAt ?? conv.createdAt,
    updatedAt: new Date().toISOString(),
  };
}
