import { isProductionMode } from "@/lib/config/app-mode";
import { founderChatFirestoreRepository } from "@/lib/data/founder-chat-firestore-repository";
import { founderChatMemoryRepository } from "@/lib/data/founder-chat-memory-repository";
import type { FounderChatRepository } from "@/lib/data/founder-chat-repository";

export function getFounderChatRepository(): FounderChatRepository {
  return isProductionMode()
    ? founderChatFirestoreRepository
    : founderChatMemoryRepository;
}
