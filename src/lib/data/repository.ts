import type {
  Conversation,
  ConversationTag,
  CreateMessageInput,
  CreateNoteInput,
  TenantScope,
} from "@/types/communication";
import { isProductionMode } from "@/lib/config/app-mode";
import { firestoreRepository } from "@/lib/data/firestore-repository";
import { memoryRepository } from "@/lib/data/memory-repository";

export interface ConversationRepository {
  listConversations(scope: TenantScope): Promise<Conversation[]>;
  getConversation(id: string, scope: TenantScope): Promise<Conversation | null>;
  findConversationByPhone(
    phone: string,
    scope: TenantScope
  ): Promise<Conversation | null>;
  addMessage(
    conversationId: string,
    input: CreateMessageInput,
    scope: TenantScope,
    author?: { name: string; id?: string }
  ): Promise<Conversation | null>;
  addInboundMessage(
    input: {
      phone: string;
      contactName?: string;
      channel: CreateMessageInput["channel"];
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
    data: { aiSummary: string; sentiment: Conversation["sentiment"] },
    scope: TenantScope
  ): Promise<Conversation | null>;
}

export function getRepository(): ConversationRepository {
  return isProductionMode() ? firestoreRepository : memoryRepository;
}
