import { inCrmScope } from "@/lib/data/crm-helpers";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { SiteBuildRepository } from "@/lib/data/site-build-repository";
import type { SiteBuildJob } from "@/types/site-builder";
import type { TenantScope } from "@/types/communication";

const COLLECTION = "site_build_jobs";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

export const siteBuildFirestoreRepository: SiteBuildRepository = {
  async list(scope) {
    const snap = await getDb()
      .collection(COLLECTION)
      .where("tenantId", "==", scope.tenantId)
      .where("workspaceId", "==", scope.workspaceId)
      .where("companyId", "==", scope.companyId)
      .get();
    return snap.docs
      .map((doc) => doc.data() as SiteBuildJob)
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  async get(id, scope) {
    const snap = await getDb().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as SiteBuildJob;
    return inCrmScope(data, scope) ? data : null;
  },

  async getByShareToken(token) {
    const normalized = token.trim();
    if (!normalized) return null;
    const snap = await getDb()
      .collection(COLLECTION)
      .where("shareToken", "==", normalized)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const data = snap.docs[0]!.data() as SiteBuildJob;
    return data.generatedSite ? data : null;
  },

  async save(job) {
    await getDb().collection(COLLECTION).doc(job.id).set(job);
    return job;
  },

  async remove(id, scope) {
    const existing = await this.get(id, scope);
    if (!existing) return false;
    await getDb().collection(COLLECTION).doc(id).delete();
    return true;
  },
};
