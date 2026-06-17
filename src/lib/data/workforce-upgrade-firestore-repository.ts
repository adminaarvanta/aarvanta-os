import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { WorkforceUpgradeRepository } from "@/lib/data/workforce-upgrade-repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import type { AgentCollaboration, SharedMemoryEntry } from "@/types/workforce";

const SHARED = "ai_shared_memory";
const COLLAB = "ai_agent_collaborations";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

async function listScoped<T extends TenantScope>(collection: string, scope: TenantScope) {
  const snap = await getDb()
    .collection(collection)
    .where("tenantId", "==", scope.tenantId)
    .where("workspaceId", "==", scope.workspaceId)
    .where("companyId", "==", scope.companyId)
    .get();
  return snap.docs.map((doc) => doc.data() as T);
}

export const workforceUpgradeFirestoreRepository: WorkforceUpgradeRepository = {
  async listSharedMemory(scope) {
    const items = await listScoped<SharedMemoryEntry>(SHARED, scope);
    return items.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async createSharedMemory(input, scope) {
    const now = crmNow();
    const entry: SharedMemoryEntry = {
      ...scope,
      ...input,
      id: crmNewId("sm"),
      createdAt: now,
      updatedAt: now,
    };
    await getDb().collection(SHARED).doc(entry.id).set(entry);
    return entry;
  },

  async listCollaborations(scope) {
    const items = await listScoped<AgentCollaboration>(COLLAB, scope);
    return items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async createCollaboration(input, scope) {
    const collab: AgentCollaboration = {
      ...scope,
      ...input,
      id: crmNewId("collab"),
      status: input.status ?? "completed",
      createdAt: crmNow(),
      completedAt: crmNow(),
    };
    await getDb().collection(COLLAB).doc(collab.id).set(collab);
    return collab;
  },
};
