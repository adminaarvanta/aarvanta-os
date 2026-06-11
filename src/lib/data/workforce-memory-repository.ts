import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { WorkforceRepository } from "@/lib/data/workforce-repository";
import type { TenantScope } from "@/types/communication";
import type { AgentRun } from "@/types/workforce";

let runs: AgentRun[] = [];

export const workforceMemoryRepository: WorkforceRepository = {
  async listRuns(scope, filters) {
    let items = runs.filter((r) => inCrmScope(r, scope));
    if (filters?.agentType) {
      items = items.filter((r) => r.agentType === filters.agentType);
    }
    items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const limit = filters?.limit ?? 50;
    return items.slice(0, limit);
  },

  async getRun(id, scope) {
    const run = runs.find((r) => r.id === id);
    return run && inCrmScope(run, scope) ? run : null;
  },

  async createRun(input, scope) {
    const run: AgentRun = {
      ...scope,
      ...input,
      id: crmNewId("agent_run"),
      createdAt: crmNow(),
    };
    runs.unshift(run);
    return run;
  },

  async updateRun(id, patch, scope) {
    const idx = runs.findIndex((r) => r.id === id && inCrmScope(r, scope));
    if (idx === -1) return null;
    runs[idx] = { ...runs[idx], ...patch };
    return runs[idx];
  },
};

export function resetWorkforceMemory() {
  runs = [];
}
