import { useMemoryDatastore } from "@/lib/data/datastore";
import { agentChatFirestoreRepository } from "@/lib/data/agent-chat-firestore-repository";
import { agentChatMemoryRepository } from "@/lib/data/agent-chat-memory-repository";
import type { AgentChatRepository } from "@/lib/data/agent-chat-repository";

export function getAgentChatRepository(): AgentChatRepository {
  return useMemoryDatastore() ? agentChatMemoryRepository : agentChatFirestoreRepository;
}
