import { findConversationForInboundEmail } from "@/lib/data/email-threading";
import { schedulePostInboundAutomation } from "@/lib/ai/refresh-conversation-insights";
import { DEMO_CONVERSATIONS } from "@/lib/data/demo-seed";
import {
  appendInboundCall,
  appendInboundEmail,
  appendInboundMessage,
  appendOutboundCall,
  appendOutboundEmail,
  appendOutboundMessage,
  createConversation,
  inScope,
  newId,
  normalizeEmail,
  normalizePhone,
} from "@/lib/data/conversation-helpers";
import { toConversationListItem } from "@/lib/data/conversation-list-helpers";
import type { ConversationRepository } from "@/lib/data/repository";
import type {
  Conversation,
  TenantScope,
  TimelineMessage,
  TimelineNote,
} from "@/types/communication";

let conversations: Conversation[] = structuredClone(DEMO_CONVERSATIONS);

function findIndex(id: string, scope: TenantScope) {
  return conversations.findIndex((c) => c.id === id && inScope(c, scope));
}

async function finishInbound(conv: Conversation, scope: TenantScope) {
  schedulePostInboundAutomation(conv.id, scope);
  return structuredClone(conv);
}

export const memoryRepository: ConversationRepository = {
  async listConversations(scope) {
    return conversations
      .filter((c) => inScope(c, scope))
      .sort(
        (a, b) =>
          new Date(b.lastActivityAt).getTime() -
          new Date(a.lastActivityAt).getTime()
      )
      .map(toConversationListItem);
  },

  async getConversation(id, scope) {
    const found = conversations.find((c) => c.id === id && inScope(c, scope));
    return found ? structuredClone(found) : null;
  },

  async getConversationById(id) {
    const found = conversations.find((c) => c.id === id);
    return found ? structuredClone(found) : null;
  },

  async findConversationByPhone(phone, scope) {
    const normalized = normalizePhone(phone);
    const found = conversations.find(
      (c) =>
        inScope(c, scope) &&
        c.contact.phone &&
        normalizePhone(c.contact.phone) === normalized
    );
    return found ? structuredClone(found) : null;
  },

  async findConversationByEmail(email, scope) {
    const normalized = normalizeEmail(email);
    const matches = conversations.filter(
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
    const found = conversations.find(
      (c) => inScope(c, scope) && c.contact.chatSessionId === sessionId
    );
    return found ? structuredClone(found) : null;
  },

  async addMessage(conversationId, input, scope, author) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    conversations[idx] = appendOutboundMessage(conversations[idx], input, author);
    return structuredClone(conversations[idx]);
  },

  async addOutboundEmail(conversationId, input, scope, author) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    conversations[idx] = appendOutboundEmail(conversations[idx], input, author);
    return structuredClone(conversations[idx]);
  },

  async addOutboundCall(conversationId, input, scope, author) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    conversations[idx] = appendOutboundCall(conversations[idx], input, author);
    return structuredClone(conversations[idx]);
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
      conversations[idx] = appendInboundMessage(conversations[idx], {
        channel: input.channel,
        content: input.content,
        authorName: input.contactName ?? input.phone,
      });
      return finishInbound(conversations[idx], scope);
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
    conversations.push(conversation);
    return finishInbound(conversation, scope);
  },

  async addInboundEmail(input, scope) {
    const normalizedEmail = normalizeEmail(input.email);
    const items = conversations.filter((c) => inScope(c, scope));
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
      conversations[idx] = appendInboundEmail(conversations[idx], emailPayload);
      return finishInbound(conversations[idx], scope);
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
    conversations.push(conversation);
    return finishInbound(conversation, scope);
  },

  async addInboundCall(input, scope) {
    const existing = await memoryRepository.findConversationByPhone(
      input.phone,
      scope
    );

    if (existing) {
      const idx = findIndex(existing.id, scope);
      conversations[idx] = appendInboundCall(conversations[idx], {
        durationSeconds: input.durationSeconds,
        summary: input.summary,
        recordingUrl: input.recordingUrl,
        authorName: input.contactName ?? input.phone,
      });
      return finishInbound(conversations[idx], scope);
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
          occurredAt: now,
          authorName: input.contactName ?? input.phone,
        },
      ]
    );
    conversations.push(conversation);
    return finishInbound(conversation, scope);
  },

  async addInboundChat(input, scope) {
    const existing = await memoryRepository.findConversationByChatSession(
      input.sessionId,
      scope
    );

    if (existing) {
      const idx = findIndex(existing.id, scope);
      conversations[idx] = appendInboundMessage(conversations[idx], {
        channel: "website_chat",
        content: input.content,
        authorName: input.visitorName ?? "Website visitor",
      });
      return finishInbound(conversations[idx], scope);
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
    conversations.push(conversation);
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

    const conv = conversations[idx];
    conv.timeline.push(note);
    conv.lastActivityAt = now;
    conv.updatedAt = now;
    return structuredClone(conv);
  },

  async setTags(conversationId, tags, scope) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    conversations[idx].tags = tags;
    conversations[idx].updatedAt = new Date().toISOString();
    return structuredClone(conversations[idx]);
  },

  async updateAiInsights(conversationId, data, scope) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    conversations[idx].aiSummary = data.aiSummary;
    conversations[idx].sentiment = data.sentiment;
    if (data.aiIntent !== undefined) {
      conversations[idx].aiIntent = data.aiIntent;
    }
    if (data.aiQualificationScore !== undefined) {
      conversations[idx].aiQualificationScore = data.aiQualificationScore;
    }
    conversations[idx].aiSummaryUpdatedAt = now;
    conversations[idx].updatedAt = now;
    return structuredClone(conversations[idx]);
  },

  async markAsRead(conversationId, scope) {
    const idx = findIndex(conversationId, scope);
    if (idx === -1) return null;
    if (conversations[idx].unreadCount === 0) {
      return structuredClone(conversations[idx]);
    }
    conversations[idx].unreadCount = 0;
    conversations[idx].updatedAt = new Date().toISOString();
    return structuredClone(conversations[idx]);
  },
};

export function resetDemoData() {
  conversations = structuredClone(DEMO_CONVERSATIONS);
}
