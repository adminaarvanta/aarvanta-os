import { useMemoryDatastore } from "@/lib/data/datastore";
import { agentMemoryFirestoreRepository } from "@/lib/data/agent-memory-firestore-repository";
import { agentMemoryMemoryRepository } from "@/lib/data/agent-memory-memory-repository";
import type { AgentMemoryRepository } from "@/lib/data/agent-memory-repository";

export function getAgentMemoryRepository(): AgentMemoryRepository {
  return useMemoryDatastore() ? agentMemoryMemoryRepository : agentMemoryFirestoreRepository;
}
