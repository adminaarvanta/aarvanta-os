import { inCrmScope } from "@/lib/data/crm-helpers";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { StorePageRepository } from "@/lib/data/store-page-repository";
import type { GeneratedStorePage } from "@/types/store-page";
import type { TenantScope } from "@/types/communication";

const COLLECTION = "generated_store_pages";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

export const storePageFirestoreRepository: StorePageRepository = {
  async list(scope) {
    const snap = await getDb()
      .collection(COLLECTION)
      .where("tenantId", "==", scope.tenantId)
      .where("workspaceId", "==", scope.workspaceId)
      .where("companyId", "==", scope.companyId)
      .get();
    return snap.docs.map((doc) => doc.data() as GeneratedStorePage);
  },

  async get(id, scope) {
    const snap = await getDb().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as GeneratedStorePage;
    return inCrmScope(data, scope) ? data : null;
  },

  async getBySlug(slug) {
    const snap = await getDb()
      .collection(COLLECTION)
      .where("slug", "==", slug)
      .where("published", "==", true)
      .limit(1)
      .get();
    if (snap.empty) return null;
    return snap.docs[0]!.data() as GeneratedStorePage;
  },

  async save(page) {
    await getDb().collection(COLLECTION).doc(page.id).set(page);
    return page;
  },

  async remove(id, scope) {
    const existing = await this.get(id, scope);
    if (!existing) return false;
    await getDb().collection(COLLECTION).doc(id).delete();
    return true;
  },
};
