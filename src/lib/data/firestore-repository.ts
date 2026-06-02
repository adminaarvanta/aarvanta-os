import type { ConversationRepository } from "@/lib/data/repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type {
  Conversation,
  ConversationTag,
  CreateMessageInput,
  CreateNoteInput,
  TenantScope,
  TimelineMessage,
  TimelineNote,
} from "@/types/communication";

const COLLECTION = "conversations";

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

function getDb() {
  const db = getAdminFirestore();
  if (!db) {
    throw new Error("Firestore is not configured for production mode.");
  }
  return db;
}

async function getScopedConversation(id: string, scope: TenantScope) {
  const snap = await getDb().collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() as Conversation;
  if (!inScope(data, scope)) return null;
  return data;
}

export const firestoreRepository: ConversationRepository = {
  async listConversations(scope) {
    const snap = await getDb()
      .collection(COLLECTION)
      .where("tenantId", "==", scope.tenantId)
      .where("workspaceId", "==", scope.workspaceId)
      .where("companyId", "==", scope.companyId)
      .orderBy("lastActivityAt", "desc")
      .get();

    return snap.docs.map((doc) => doc.data() as Conversation);
  },

  async getConversation(id, scope) {
    return getScopedConversation(id, scope);
  },

  async findConversationByPhone(phone, scope) {
    const normalized = normalizePhone(phone);
    const snap = await getDb()
      .collection(COLLECTION)
      .where("tenantId", "==", scope.tenantId)
      .where("workspaceId", "==", scope.workspaceId)
      .where("companyId", "==", scope.companyId)
      .get();

    const found = snap.docs
      .map((doc) => doc.data() as Conversation)
      .find(
        (c) => c.contact.phone && normalizePhone(c.contact.phone) === normalized
      );

    return found ?? null;
  },

  async addMessage(conversationId, input, scope, author) {
    const conv = await getScopedConversation(conversationId, scope);
    if (!conv) return null;

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

    const channels = conv.channels.includes(input.channel)
      ? conv.channels
      : [...conv.channels, input.channel];

    const updated: Conversation = {
      ...conv,
      channels,
      timeline: [...conv.timeline, message],
      lastActivityAt: now,
      updatedAt: now,
      unreadCount: 0,
    };

    await getDb().collection(COLLECTION).doc(conversationId).set(updated);
    return updated;
  },

  async addInboundMessage(input, scope) {
    const existing = await firestoreRepository.findConversationByPhone(
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
      const channels = existing.channels.includes(input.channel)
        ? existing.channels
        : [...existing.channels, input.channel];

      const updated: Conversation = {
        ...existing,
        channels,
        timeline: [...existing.timeline, message],
        lastActivityAt: now,
        updatedAt: now,
        unreadCount: existing.unreadCount + 1,
      };

      await getDb().collection(COLLECTION).doc(existing.id).set(updated);
      return updated;
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

    await getDb().collection(COLLECTION).doc(conversation.id).set(conversation);
    return conversation;
  },

  async addInternalNote(conversationId, input, scope, author) {
    const conv = await getScopedConversation(conversationId, scope);
    if (!conv) return null;

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

    const updated: Conversation = {
      ...conv,
      timeline: [...conv.timeline, note],
      lastActivityAt: now,
      updatedAt: now,
    };

    await getDb().collection(COLLECTION).doc(conversationId).set(updated);
    return updated;
  },

  async setTags(conversationId, tags, scope) {
    const conv = await getScopedConversation(conversationId, scope);
    if (!conv) return null;

    const updated: Conversation = {
      ...conv,
      tags,
      updatedAt: new Date().toISOString(),
    };

    await getDb().collection(COLLECTION).doc(conversationId).set(updated);
    return updated;
  },

  async updateAiInsights(conversationId, data, scope) {
    const conv = await getScopedConversation(conversationId, scope);
    if (!conv) return null;

    const now = new Date().toISOString();
    const updated: Conversation = {
      ...conv,
      aiSummary: data.aiSummary,
      sentiment: data.sentiment,
      aiSummaryUpdatedAt: now,
      updatedAt: now,
    };

    await getDb().collection(COLLECTION).doc(conversationId).set(updated);
    return updated;
  },
};
