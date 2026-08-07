import { findConversationForInboundEmail } from "@/lib/data/email-threading";
import { schedulePostInboundAutomation } from "@/lib/ai/refresh-conversation-insights";
import { syncInboundToExistingCrmContact } from "@/lib/data/inbound-crm-bridge";
import { DEMO_CONVERSATIONS } from "@/lib/data/demo-seed";
import {
  appendInboundCall,
  appendInboundEmail,
  appendInboundMessage,
  appendOutboundCall,
  appendOutboundEmail,
  appendOutboundMessage,
  attachCallRecording,
  patchTimelineCallBySid,
  createConversation,
  inScope,
  newId,
  normalizeEmail,
  normalizePhone,
  withChannel,
} from "@/lib/data/conversation-helpers";
import { toConversationListItem } from "@/lib/data/conversation-list-helpers";
import type { ConversationRepository } from "@/lib/data/repository";
import type {
  Conversation,
  ConversationTag,
  CreateMessageInput,
  CreateNoteInput,
  TenantScope,
  TimelineMessage,
  TimelineNote,
} from "@/types/communication";

/**
 * Share one in-memory store across Next.js RSC and route-handler module
 * graphs in `next dev`. Without this, sends via API never appear after
 * `router.refresh()` because each layer held a separate singleton.
 */
const globalStore = globalThis as typeof globalThis & {
  __aarvantaConversations?: Conversation[];
};

function getConversations(): Conversation[] {
  if (!globalStore.__aarvantaConversations) {
    globalStore.__aarvantaConversations = structuredClone(DEMO_CONVERSATIONS);
  }
  return globalStore.__aarvantaConversations;
}

function findIndex(id: string, scope: TenantScope) {
  return getConversations().findIndex((c) => c.id === id && inScope(c, scope));
}

async function finishInbound(conv: Conversation, scope: TenantScope) {
  schedulePostInboundAutomation(conv.id, scope);
  return structuredClone(conv);
}

export const memoryRepository: ConversationRepository = {
  async listConversations(scope) {
    return getConversations()
      .filter((c) => inScope(c, scope))
      .sort(
        (a, b) =>
          new Date(b.lastActivityAt).getTime() -
          new Date(a.lastActivityAt).getTime()
      )
      .map(toConversationListItem);
  },

  async getConversation(id, scope) {
    const found = getConversations().find((c) => c.id === id && inScope(c, scope));
    return found ? structuredClone(found) : null;
  },

  async getConversationById(id) {
    const found = getConversations().find((c) => c.id === id);
    return found ? structuredClone(found) : null;
  },

  async findConversationByPhone(phone, scope) {
    const normalized = normalizePhone(phone);
    const found = getConversations().find(
      (c) =>
        inScope(c, scope) &&
        c.contact.phone &&
        normalizePhone(c.contact.phone) === normalized
    );
    return found ? structuredClone(found) : null;
  },

  async findConversationByEmail(email, scope) {
    const normalized = normalizeEmail(email);
    const matches = getConversations().filter(
      (c) =>
        inScope(c, scope) &&
        c.contact.email &&
        normalizeEmail(c.contact.email) === normalized
    );
    const found = matches.sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() -
        new Date(a.lastActivityAt).getTime()
    )[0];
    return found ? structuredClone(found) : null;
  },

  async findConversationByChatSession(sessionId, scope) {
    const found = getConversations().find(
      (c) => inScope(c, scope) && c.contact.chatSessionId === sessionId
    );
    return found ? structuredClone(found) : null;
  },

  async ensurePhoneConversation(input, scope) {
    const existing = await memoryRepository.findConversationByPhone(
      input.phone,
      scope
    );
    const now = new Date().toISOString();

    if (existing) {
      const idx = findIndex(existing.id, scope);
      if (idx === -1) return structuredClone(existing);
      const nextChannels = withChannel(getConversations()[idx].channels, input.channel);
      const name =
        input.contactName?.trim() &&
        getConversations()[idx].contact.name === getConversations()[idx].contact.phone
          ? input.contactName.trim()
          : getConversations()[idx].contact.name;
      getConversations()[idx] = {
        ...getConversations()[idx],
        channels: nextChannels,
        contact: {
          ...getConversations()[idx].contact,
          name,
          phone: getConversations()[idx].contact.phone ?? input.phone,
        },
        updatedAt: now,
      };
      return structuredClone(getConversations()[idx]);
    }

    const conversation = createConversation(
      scope,
      {
        id: newId("contact"),
        name: input.contactName?.trim() || input.phone,
        phone: input.phone,
      },
      input.channel,
      []
    );
    getConversations().push(conversation);
    return structuredClone(conversation);
  },

  async addMessage(conversationId, input, scope, author) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    getConversations()[idx] = appendOutboundMessage(getConversations()[idx], input, author);
    return structuredClone(getConversations()[idx]);
  },

  async addOutboundEmail(conversationId, input, scope, author) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    getConversations()[idx] = appendOutboundEmail(getConversations()[idx], input, author);
    return structuredClone(getConversations()[idx]);
  },

  async addOutboundCall(conversationId, input, scope, author) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    getConversations()[idx] = appendOutboundCall(getConversations()[idx], input, author);
    return structuredClone(getConversations()[idx]);
  },

  async addInboundMessage(input, scope) {
    const existing = await memoryRepository.findConversationByPhone(
      input.phone,
      scope
    );
    const now = new Date().toISOString();
    const message: TimelineMessage = {
      id: newId("evt"),
      type: "message",
      direction: "inbound",
      channel: input.channel,
      content: input.content,
      occurredAt: now,
      authorName: input.contactName ?? input.phone,
    };

    if (existing) {
      const idx = findIndex(existing.id, scope);
      getConversations()[idx] = appendInboundMessage(getConversations()[idx], {
        channel: input.channel,
        content: input.content,
        authorName: input.contactName ?? input.phone,
      });
      return finishInbound(getConversations()[idx], scope);
    }

    const conversation = createConversation(
      scope,
      {
        id: newId("contact"),
        name: input.contactName ?? input.phone,
        phone: input.phone,
      },
      input.channel,
      [message]
    );
    getConversations().push(conversation);
    return finishInbound(conversation, scope);
  },

  async addInboundEmail(input, scope) {
    const normalizedEmail = normalizeEmail(input.email);
    const items = getConversations().filter((c) => inScope(c, scope));
    const existing = findConversationForInboundEmail(items, {
      fromEmail: normalizedEmail,
      subject: input.subject,
      inReplyTo: input.inReplyTo,
      references: input.references,
      to: input.to,
    });

    const emailPayload = {
      subject: input.subject,
      body: input.body,
      authorName: input.contactName ?? normalizedEmail.split("@")[0],
      messageId: input.messageId,
      providerId: input.providerId,
    };

    if (existing) {
      const idx = findIndex(existing.id, scope);
      getConversations()[idx] = appendInboundEmail(getConversations()[idx], emailPayload);
      return finishInbound(getConversations()[idx], scope);
    }

    const now = new Date().toISOString();
    const conversation = createConversation(
      scope,
      {
        id: newId("contact"),
        name: input.contactName ?? normalizedEmail.split("@")[0],
        email: normalizedEmail,
      },
      "email",
      [
        {
          id: newId("evt"),
          type: "email",
          direction: "inbound",
          subject: input.subject,
          bodyPreview: input.body,
          occurredAt: now,
          authorName: input.contactName ?? normalizedEmail.split("@")[0],
          messageId: input.messageId,
          providerId: input.providerId,
        },
      ]
    );
    getConversations().push(conversation);
    return finishInbound(conversation, scope);
  },

  async addInboundCall(input, scope) {
    const existing = await memoryRepository.findConversationByPhone(
      input.phone,
      scope
    );

    if (existing) {
      const idx = findIndex(existing.id, scope);
      getConversations()[idx] = appendInboundCall(getConversations()[idx], {
        durationSeconds: input.durationSeconds,
        summary: input.summary,
        recordingUrl: input.recordingUrl,
        recordingSid: input.recordingSid,
        callSid: input.callSid,
        authorName: input.contactName ?? input.phone,
      });
      return finishInbound(getConversations()[idx], scope);
    }

    const now = new Date().toISOString();
    const conversation = createConversation(
      scope,
      {
        id: newId("contact"),
        name: input.contactName ?? input.phone,
        phone: input.phone,
      },
      "voice",
      [
        {
          id: newId("evt"),
          type: "call",
          direction: "inbound",
          durationSeconds: input.durationSeconds,
          summary: input.summary,
          recordingUrl: input.recordingUrl,
          recordingSid: input.recordingSid,
          callSid: input.callSid,
          occurredAt: now,
          authorName: input.contactName ?? input.phone,
        },
      ]
    );
    getConversations().push(conversation);
    return finishInbound(conversation, scope);
  },

  async attachCallRecording(conversationId, input, scope) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    getConversations()[idx] = attachCallRecording(getConversations()[idx], input);
    return structuredClone(getConversations()[idx]);
  },

  async patchCallBySid(conversationId, callSid, patch, scope) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    const updated = patchTimelineCallBySid(
      getConversations()[idx],
      callSid,
      patch
    );
    if (!updated) return null;
    getConversations()[idx] = updated;
    return structuredClone(updated);
  },

  async addInboundChat(input, scope) {
    const existing = await memoryRepository.findConversationByChatSession(
      input.sessionId,
      scope
    );

    if (existing) {
      const idx = findIndex(existing.id, scope);
      getConversations()[idx] = appendInboundMessage(getConversations()[idx], {
        channel: "website_chat",
        content: input.content,
        authorName: input.visitorName ?? "Website visitor",
      });
      return finishInbound(getConversations()[idx], scope);
    }

    const now = new Date().toISOString();
    const conversation = createConversation(
      scope,
      {
        id: newId("contact"),
        name: input.visitorName ?? "Website visitor",
        chatSessionId: input.sessionId,
      },
      "website_chat",
      [
        {
          id: newId("evt"),
          type: "message",
          direction: "inbound",
          channel: "website_chat",
          content: input.content,
          occurredAt: now,
          authorName: input.visitorName ?? "Website visitor",
        },
      ]
    );
    getConversations().push(conversation);
    return finishInbound(conversation, scope);
  },

  async addInternalNote(conversationId, input, scope, author) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;

    const now = new Date().toISOString();
    const note: TimelineNote = {
      id: newId("evt"),
      type: "note",
      content: input.content,
      isInternal: true,
      occurredAt: now,
      authorName: author?.name ?? "You",
      authorId: author?.id,
    };

    const conv = getConversations()[idx];
    conv.timeline.push(note);
    conv.lastActivityAt = now;
    conv.updatedAt = now;
    return structuredClone(conv);
  },

  async setTags(conversationId, tags, scope) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    getConversations()[idx].tags = tags;
    getConversations()[idx].updatedAt = new Date().toISOString();
    return structuredClone(getConversations()[idx]);
  },

  async updateAiInsights(conversationId, data, scope) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    getConversations()[idx].aiSummary = data.aiSummary;
    getConversations()[idx].sentiment = data.sentiment;
    if (data.aiIntent !== undefined) {
      getConversations()[idx].aiIntent = data.aiIntent;
    }
    if (data.aiQualificationScore !== undefined) {
      getConversations()[idx].aiQualificationScore = data.aiQualificationScore;
    }
    getConversations()[idx].aiSummaryUpdatedAt = now;
    getConversations()[idx].updatedAt = now;
    return structuredClone(getConversations()[idx]);
  },

  async updateIdentity(conversationId, identity, scope) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    getConversations()[idx].identity = identity;
    getConversations()[idx].updatedAt = new Date().toISOString();
    return structuredClone(getConversations()[idx]);
  },

  async markAsRead(conversationId, scope) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    if (getConversations()[idx].unreadCount === 0) {
      return structuredClone(getConversations()[idx]);
    }
    getConversations()[idx].unreadCount = 0;
    getConversations()[idx].updatedAt = new Date().toISOString();
    return structuredClone(getConversations()[idx]);
  },
};

export function resetDemoData() {
  globalStore.__aarvantaConversations = structuredClone(DEMO_CONVERSATIONS);
}
