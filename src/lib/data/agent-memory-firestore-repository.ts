import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { AgentMemoryRepository } from "@/lib/data/agent-memory-repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import type { AgentMemoryEntry } from "@/types/workforce";

const COLLECTION = "ai_agent_memory";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

async function listScoped(scope: TenantScope): Promise<AgentMemoryEntry[]> {
  const snap = await getDb()
    .collection(COLLECTION)
    .where("tenantId", "==", scope.tenantId)
    .where("workspaceId", "==", scope.workspaceId)
    .where("companyId", "==", scope.companyId)
    .get();
  return snap.docs.map((doc) => doc.data() as AgentMemoryEntry);
}

export const agentMemoryFirestoreRepository: AgentMemoryRepository = {
  async listMemory(scope, agentType, limit = 50) {
    const items = (await listScoped(scope))
      .filter((m) => m.agentType === agentType)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return items.slice(0, limit);
  },

  async addMemory(input, scope) {
    const entry: AgentMemoryEntry = {
      ...scope,
      ...input,
      id: crmNewId("agent_mem"),
      createdAt: crmNow(),
    };
    await getDb().collection(COLLECTION).doc(entry.id).set(entry);
    return entry;
  },

  async deleteMemory(id, scope) {
    const snap = await getDb().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return false;
    const data = snap.data() as AgentMemoryEntry;
    if (!inCrmScope(data, scope)) return false;
    await getDb().collection(COLLECTION).doc(id).delete();
    return true;
  },
};
