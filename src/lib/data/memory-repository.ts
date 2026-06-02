import { DEMO_CONVERSATIONS } from "@/lib/data/demo-seed";
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

let conversations: Conversation[] = structuredClone(DEMO_CONVERSATIONS);

function inScope(c: Conversation, scope: TenantScope) {
  return (
    c.tenantId === scope.tenantId &&
    c.workspaceId === scope.workspaceId &&
    c.companyId === scope.companyId
  );
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").replace(/^\+/, "");
}

export const memoryRepository: ConversationRepository = {
  async listConversations(scope) {
    return conversations
      .filter((c) => inScope(c, scope))
      .sort(
        (a, b) =>
          new Date(b.lastActivityAt).getTime() -
          new Date(a.lastActivityAt).getTime()
      );
  },

  async getConversation(id, scope) {
    const found = conversations.find((c) => c.id === id && inScope(c, scope));
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

  async addMessage(conversationId, input, scope, author) {
    const idx = conversations.findIndex(
      (c) => c.id === conversationId && inScope(c, scope)
    );
    if (idx === -1) return null;

    const now = new Date().toISOString();
    const message: TimelineMessage = {
      id: newId("evt"),
      type: "message",
      direction: "outbound",
      channel: input.channel,
      content: input.content,
      occurredAt: now,
      authorName: author?.name ?? "You",
      authorId: author?.id,
    };

    const conv = conversations[idx];
    if (!conv.channels.includes(input.channel)) {
      conv.channels = [...conv.channels, input.channel];
    }
    conv.timeline.push(message);
    conv.lastActivityAt = now;
    conv.updatedAt = now;
    conv.unreadCount = 0;

    return structuredClone(conv);
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
      const idx = conversations.findIndex((c) => c.id === existing.id);
      const conv = conversations[idx];
      if (!conv.channels.includes(input.channel)) {
        conv.channels = [...conv.channels, input.channel];
      }
      conv.timeline.push(message);
      conv.lastActivityAt = now;
      conv.updatedAt = now;
      conv.unreadCount += 1;
      return structuredClone(conv);
    }

    const conversation: Conversation = {
      ...scope,
      id: newId("conv"),
      contact: {
        id: newId("contact"),
        name: input.contactName ?? input.phone,
        phone: input.phone,
      },
      channels: [input.channel],
      tags: [],
      sentiment: "neutral",
      unreadCount: 1,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
      timeline: [message],
    };
    conversations.push(conversation);
    return structuredClone(conversation);
  },

  async addInternalNote(conversationId, input, scope, author) {
    const idx = conversations.findIndex(
      (c) => c.id === conversationId && inScope(c, scope)
    );
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
    const idx = conversations.findIndex(
      (c) => c.id === conversationId && inScope(c, scope)
    );
    if (idx === -1) return null;

    conversations[idx].tags = tags;
    conversations[idx].updatedAt = new Date().toISOString();
    return structuredClone(conversations[idx]);
  },

  async updateAiInsights(conversationId, data, scope) {
    const idx = conversations.findIndex(
      (c) => c.id === conversationId && inScope(c, scope)
    );
    if (idx === -1) return null;

    const now = new Date().toISOString();
    conversations[idx].aiSummary = data.aiSummary;
    conversations[idx].sentiment = data.sentiment;
    conversations[idx].aiSummaryUpdatedAt = now;
    conversations[idx].updatedAt = now;

    return structuredClone(conversations[idx]);
  },
};

export function resetDemoData() {
  conversations = structuredClone(DEMO_CONVERSATIONS);
}
