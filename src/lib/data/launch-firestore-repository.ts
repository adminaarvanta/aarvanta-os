import { inCrmScope } from "@/lib/data/crm-helpers";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { LaunchRepository } from "@/lib/data/launch-repository";
import type { LaunchSession } from "@/types/launch";

const COLLECTION = "launch_sessions";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

export const launchFirestoreRepository: LaunchRepository = {
  async list(scope) {
    const snap = await getDb()
      .collection(COLLECTION)
      .where("tenantId", "==", scope.tenantId)
      .where("workspaceId", "==", scope.workspaceId)
      .where("companyId", "==", scope.companyId)
      .get();
    return snap.docs
      .map((doc) => doc.data() as LaunchSession)
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  async get(id, scope) {
    const snap = await getDb().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as LaunchSession;
    return inCrmScope(data, scope) ? data : null;
  },

  async save(session) {
    await getDb().collection(COLLECTION).doc(session.id).set(session);
    return session;
  },

  async remove(id, scope) {
    const existing = await this.get(id, scope);
    if (!existing) return false;
    await getDb().collection(COLLECTION).doc(id).delete();
    return true;
  },
};
