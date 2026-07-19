import { findConversationForInboundEmail } from "@/lib/data/email-threading";
import { schedulePostInboundAutomation } from "@/lib/ai/refresh-conversation-insights";
import { syncInboundToExistingCrmContact } from "@/lib/data/inbound-crm-bridge";
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
  withChannel,
} from "@/lib/data/conversation-helpers";
import { toConversationListItem } from "@/lib/data/conversation-list-helpers";
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

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

async function save(conv: Conversation) {
  await getDb().collection(COLLECTION).doc(conv.id).set(conv);
  return conv;
}

async function saveInbound(conv: Conversation, scope: TenantScope) {
  const saved = await save(conv);
  schedulePostInboundAutomation(saved.id, scope);
  await syncInboundToExistingCrmContact(saved, scope);
  return saved;
}

async function getScopedConversation(id: string, scope: TenantScope) {
  const snap = await getDb().collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() as Conversation;
  if (!inScope(data, scope)) return null;
  return data;
}

async function listScoped(scope: TenantScope) {
  const snap = await getDb()
    .collection(COLLECTION)
    .where("tenantId", "==", scope.tenantId)
    .where("workspaceId", "==", scope.workspaceId)
    .where("companyId", "==", scope.companyId)
    .get();
  return snap.docs.map((doc) => doc.data() as Conversation);
}

export const firestoreRepository: ConversationRepository = {
  async listConversations(scope) {
    const items = await listScoped(scope);
    return items
      .sort(
        (a, b) =>
          new Date(b.lastActivityAt).getTime() -
          new Date(a.lastActivityAt).getTime()
      )
      .map(toConversationListItem);
  },

  async getConversation(id, scope) {
    return getScopedConversation(id, scope);
  },

  async getConversationById(id) {
    const snap = await getDb().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    return snap.data() as Conversation;
  },

  async findConversationByPhone(phone, scope) {
    const normalized = normalizePhone(phone);
    const items = await listScoped(scope);
    return (
      items.find(
        (c) => c.contact.phone && normalizePhone(c.contact.phone) === normalized
      ) ?? null
    );
  },

  async findConversationByEmail(email, scope) {
    const normalized = normalizeEmail(email);
    const items = await listScoped(scope);
    const matches = items.filter(
      (c) => c.contact.email && normalizeEmail(c.contact.email) === normalized
    );
    return (
      matches.sort(
        (a, b) =>
          new Date(b.lastActivityAt).getTime() -
          new Date(a.lastActivityAt).getTime()
      )[0] ?? null
    );
  },

  async findConversationByChatSession(sessionId, scope) {
    const items = await listScoped(scope);
    return (
      items.find((c) => c.contact.chatSessionId === sessionId) ?? null
    );
  },

  async ensurePhoneConversation(input, scope) {
    const existing = await firestoreRepository.findConversationByPhone(
      input.phone,
      scope
    );
    const now = new Date().toISOString();

    if (existing) {
      const name =
        input.contactName?.trim() &&
        existing.contact.name === existing.contact.phone
          ? input.contactName.trim()
          : existing.contact.name;
      return save({
        ...existing,
        channels: withChannel(existing.channels, input.channel),
        contact: {
          ...existing.contact,
          name,
          phone: existing.contact.phone ?? input.phone,
        },
        updatedAt: now,
      });
    }

    return save(
      createConversation(
        scope,
        {
          id: newId("contact"),
          name: input.contactName?.trim() || input.phone,
          phone: input.phone,
        },
        input.channel,
        []
      )
    );
  },

  async addMessage(conversationId, input, scope, author) {
    const conv = await getScopedConversation(conversationId, scope);
    if (!conv) return null;
    return save(appendOutboundMessage(conv, input, author));
  },

  async addOutboundEmail(conversationId, input, scope, author) {
    const conv = await getScopedConversation(conversationId, scope);
    if (!conv) return null;
    return save(appendOutboundEmail(conv, input, author));
  },

  async addOutboundCall(conversationId, input, scope, author) {
    const conv = await getScopedConversation(conversationId, scope);
    if (!conv) return null;
    return save(appendOutboundCall(conv, input, author));
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
      return saveInbound(
        appendInboundMessage(existing, {
          channel: input.channel,
          content: input.content,
          authorName: input.contactName ?? input.phone,
        }),
        scope
      );
    }

    return saveInbound(
      createConversation(
        scope,
        {
          id: newId("contact"),
          name: input.contactName ?? input.phone,
          phone: input.phone,
        },
        input.channel,
        [message]
      ),
      scope
    );
  },

  async addInboundEmail(input, scope) {
    const normalizedEmail = normalizeEmail(input.email);
    const items = await listScoped(scope);
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
      return saveInbound(appendInboundEmail(existing, emailPayload), scope);
    }

    const now = new Date().toISOString();
    return saveInbound(
      createConversation(
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
            ...(input.messageId ? { messageId: input.messageId } : {}),
            ...(input.providerId ? { providerId: input.providerId } : {}),
          },
        ]
      ),
      scope
    );
  },

  async addInboundCall(input, scope) {
    const existing = await firestoreRepository.findConversationByPhone(
      input.phone,
      scope
    );

    if (existing) {
      return saveInbound(
        appendInboundCall(existing, {
          durationSeconds: input.durationSeconds,
          summary: input.summary,
          recordingUrl: input.recordingUrl,
          authorName: input.contactName ?? input.phone,
        }),
        scope
      );
    }

    const now = new Date().toISOString();
    return saveInbound(
      createConversation(
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
      ),
      scope
    );
  },

  async addInboundChat(input, scope) {
    const existing = await firestoreRepository.findConversationByChatSession(
      input.sessionId,
      scope
    );

    if (existing) {
      return saveInbound(
        appendInboundMessage(existing, {
          channel: "website_chat",
          content: input.content,
          authorName: input.visitorName ?? "Website visitor",
        }),
        scope
      );
    }

    const now = new Date().toISOString();
    return saveInbound(
      createConversation(
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
      ),
      scope
    );
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

    return save({
      ...conv,
      timeline: [...conv.timeline, note],
      lastActivityAt: now,
      updatedAt: now,
    });
  },

  async setTags(conversationId, tags, scope) {
    const conv = await getScopedConversation(conversationId, scope);
    if (!conv) return null;
    return save({ ...conv, tags, updatedAt: new Date().toISOString() });
  },

  async updateAiInsights(conversationId, data, scope) {
    const conv = await getScopedConversation(conversationId, scope);
    if (!conv) return null;
    const now = new Date().toISOString();
    return save({
      ...conv,
      aiSummary: data.aiSummary,
      sentiment: data.sentiment,
      ...(data.aiIntent !== undefined ? { aiIntent: data.aiIntent } : {}),
      ...(data.aiQualificationScore !== undefined
        ? { aiQualificationScore: data.aiQualificationScore }
        : {}),
      aiSummaryUpdatedAt: now,
      updatedAt: now,
    });
  },

  async markAsRead(conversationId, scope) {
    const conv = await getScopedConversation(conversationId, scope);
    if (!conv) return null;
    if (conv.unreadCount === 0) return conv;
    return save({
      ...conv,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    });
  },
};
