import type {
  Channel,
  Conversation,
  ConversationTag,
  CreateMessageInput,
  CreateNoteInput,
  TenantScope,
} from "@/types/communication";
import {
  createResilientRepository,
} from "@/lib/data/datastore";
import { firestoreRepository } from "@/lib/data/firestore-repository";
import { memoryRepository } from "@/lib/data/memory-repository";

export interface ConversationRepository {
  listConversations(scope: TenantScope): Promise<Conversation[]>;
  getConversation(id: string, scope: TenantScope): Promise<Conversation | null>;
  getConversationById(id: string): Promise<Conversation | null>;
  findConversationByPhone(
    phone: string,
    scope: TenantScope
  ): Promise<Conversation | null>;
  findConversationByEmail(
    email: string,
    scope: TenantScope
  ): Promise<Conversation | null>;
  findConversationByChatSession(
    sessionId: string,
    scope: TenantScope
  ): Promise<Conversation | null>;
  /** Find or create a conversation for a phone number on a given channel. */
  ensurePhoneConversation(
    input: {
      phone: string;
      contactName?: string;
      channel: Channel;
    },
    scope: TenantScope
  ): Promise<Conversation>;
  addMessage(
    conversationId: string,
    input: CreateMessageInput,
    scope: TenantScope,
    author?: { name: string; id?: string }
  ): Promise<Conversation | null>;
  addOutboundEmail(
    conversationId: string,
    input: { subject: string; content: string; messageId?: string; providerId?: string },
    scope: TenantScope,
    author?: { name: string; id?: string }
  ): Promise<Conversation | null>;
  addOutboundCall(
    conversationId: string,
    input: { summary: string },
    scope: TenantScope,
    author?: { name: string; id?: string }
  ): Promise<Conversation | null>;
  addInboundMessage(
    input: {
      phone: string;
      contactName?: string;
      channel: Channel;
      content: string;
    },
    scope: TenantScope
  ): Promise<Conversation>;
  addInboundEmail(
    input: {
      email: string;
      contactName?: string;
      subject: string;
      body: string;
      inReplyTo?: string[];
      references?: string[];
      to?: string[];
      providerId?: string;
      messageId?: string;
    },
    scope: TenantScope
  ): Promise<Conversation>;
  addInboundCall(
    input: {
      phone: string;
      contactName?: string;
      durationSeconds: number;
      summary?: string;
      recordingUrl?: string;
    },
    scope: TenantScope
  ): Promise<Conversation>;
  addInboundChat(
    input: {
      sessionId: string;
      visitorName?: string;
      content: string;
    },
    scope: TenantScope
  ): Promise<Conversation>;
  addInternalNote(
    conversationId: string,
    input: CreateNoteInput,
    scope: TenantScope,
    author?: { name: string; id?: string }
  ): Promise<Conversation | null>;
  setTags(
    conversationId: string,
    tags: ConversationTag[],
    scope: TenantScope
  ): Promise<Conversation | null>;
  updateAiInsights(
    conversationId: string,
    data: {
      aiSummary: string;
      sentiment: Conversation["sentiment"];
      aiIntent?: Conversation["aiIntent"];
      aiQualificationScore?: number;
    },
    scope: TenantScope
  ): Promise<Conversation | null>;
  updateIdentity(
    conversationId: string,
    identity: Conversation["identity"],
    scope: TenantScope
  ): Promise<Conversation | null>;
  markAsRead(
    conversationId: string,
    scope: TenantScope
  ): Promise<Conversation | null>;
}

export function getRepository(): ConversationRepository {
  return createResilientRepository(memoryRepository, firestoreRepository);
}
