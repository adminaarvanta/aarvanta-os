import { isProductionMode } from "@/lib/config/app-mode";
import { agentChatFirestoreRepository } from "@/lib/data/agent-chat-firestore-repository";
import { agentChatMemoryRepository } from "@/lib/data/agent-chat-memory-repository";
import type { AgentChatRepository } from "@/lib/data/agent-chat-repository";

export function getAgentChatRepository(): AgentChatRepository {
  return isProductionMode()
    ? agentChatFirestoreRepository
    : agentChatMemoryRepository;
}
