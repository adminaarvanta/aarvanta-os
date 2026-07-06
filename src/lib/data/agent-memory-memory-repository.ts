import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { AgentMemoryRepository } from "@/lib/data/agent-memory-repository";
import { DEMO_AGENT_MEMORY } from "@/lib/data/workforce-demo-seed";
import type { AgentMemoryEntry } from "@/types/workforce";

let memory: AgentMemoryEntry[] = structuredClone(DEMO_AGENT_MEMORY);

export const agentMemoryMemoryRepository: AgentMemoryRepository = {
  async listMemory(scope, agentType, limit = 50) {
    return memory
      .filter((m) => inCrmScope(m, scope) && m.agentType === agentType)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  },

  async addMemory(input, scope) {
    const entry: AgentMemoryEntry = {
      ...scope,
      ...input,
      id: crmNewId("agent_mem"),
      createdAt: crmNow(),
    };
    memory.unshift(entry);
    return entry;
  },

  async deleteMemory(id, scope) {
    const idx = memory.findIndex((m) => m.id === id && inCrmScope(m, scope));
    if (idx === -1) return false;
    memory.splice(idx, 1);
    return true;
  },
};

export function resetAgentMemory() {
  memory = structuredClone(DEMO_AGENT_MEMORY);
}
