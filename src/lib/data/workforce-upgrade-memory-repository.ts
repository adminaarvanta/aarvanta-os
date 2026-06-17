import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import {
  buildDemoCollaborations,
  buildDemoSharedMemory,
} from "@/lib/data/workforce-upgrade-demo-seed";
import type { WorkforceUpgradeRepository } from "@/lib/data/workforce-upgrade-repository";
import type { TenantScope } from "@/types/communication";

let sharedMemory = buildDemoSharedMemory();
let collaborations = buildDemoCollaborations();

export const workforceUpgradeMemoryRepository: WorkforceUpgradeRepository = {
  async listSharedMemory(scope) {
    return sharedMemory
      .filter((m) => inCrmScope(m, scope))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  async createSharedMemory(input, scope) {
    const now = crmNow();
    const entry = {
      ...scope,
      ...input,
      id: crmNewId("sm"),
      createdAt: now,
      updatedAt: now,
    };
    sharedMemory.unshift(entry);
    return entry;
  },

  async listCollaborations(scope) {
    return collaborations
      .filter((c) => inCrmScope(c, scope))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  async createCollaboration(input, scope) {
    const collab = {
      ...scope,
      ...input,
      id: crmNewId("collab"),
      status: input.status ?? ("completed" as const),
      createdAt: crmNow(),
      completedAt: crmNow(),
    };
    collaborations.unshift(collab);
    return collab;
  },
};

export function resetWorkforceUpgradeMemory() {
  sharedMemory = buildDemoSharedMemory();
  collaborations = buildDemoCollaborations();
}
