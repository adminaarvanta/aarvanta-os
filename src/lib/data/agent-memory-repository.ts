import type { TenantScope } from "@/types/communication";
import type { AgentMemoryEntry, AgentType } from "@/types/workforce";

export interface AgentMemoryRepository {
  listMemory(
    scope: TenantScope,
    agentType: AgentType,
    limit?: number
  ): Promise<AgentMemoryEntry[]>;
  addMemory(
    input: Omit<AgentMemoryEntry, keyof TenantScope | "id" | "createdAt">,
    scope: TenantScope
  ): Promise<AgentMemoryEntry>;
  deleteMemory(id: string, scope: TenantScope): Promise<boolean>;
}
