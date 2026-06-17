import { isProductionMode } from "@/lib/config/app-mode";
import { agentMemoryFirestoreRepository } from "@/lib/data/agent-memory-firestore-repository";
import { agentMemoryMemoryRepository } from "@/lib/data/agent-memory-memory-repository";
import type { AgentMemoryRepository } from "@/lib/data/agent-memory-repository";

export function getAgentMemoryRepository(): AgentMemoryRepository {
  return isProductionMode()
    ? agentMemoryFirestoreRepository
    : agentMemoryMemoryRepository;
}
