import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { WorkforceRepository } from "@/lib/data/workforce-repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import type { AgentRun } from "@/types/workforce";

const COLLECTION = "ai_agent_runs";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

async function listScoped(scope: TenantScope): Promise<AgentRun[]> {
  const snap = await getDb()
    .collection(COLLECTION)
    .where("tenantId", "==", scope.tenantId)
    .where("workspaceId", "==", scope.workspaceId)
    .where("companyId", "==", scope.companyId)
    .get();
  return snap.docs.map((doc) => doc.data() as AgentRun);
}

async function getScoped(id: string, scope: TenantScope): Promise<AgentRun | null> {
  const snap = await getDb().collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() as AgentRun;
  return inCrmScope(data, scope) ? data : null;
}

export const workforceFirestoreRepository: WorkforceRepository = {
  async listRuns(scope, filters) {
    let items = await listScoped(scope);
    if (filters?.agentType) {
      items = items.filter((r) => r.agentType === filters.agentType);
    }
    items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return items.slice(0, filters?.limit ?? 50);
  },

  async getRun(id, scope) {
    return getScoped(id, scope);
  },

  async createRun(input, scope) {
    const run: AgentRun = {
      ...scope,
      ...input,
      id: crmNewId("agent_run"),
      createdAt: crmNow(),
    };
    await getDb().collection(COLLECTION).doc(run.id).set(run);
    return run;
  },

  async updateRun(id, patch, scope) {
    const existing = await getScoped(id, scope);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    await getDb().collection(COLLECTION).doc(id).set(updated);
    return updated;
  },
};
