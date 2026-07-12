import { inCrmScope } from "@/lib/data/crm-helpers";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { DomainOrderRepository } from "@/lib/data/domain-order-repository";
import type { DomainOrder } from "@/types/site-builder";
import type { TenantScope } from "@/types/communication";

const COLLECTION = "domain_orders";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

export const domainOrderFirestoreRepository: DomainOrderRepository = {
  async list(scope) {
    const snap = await getDb()
      .collection(COLLECTION)
      .where("tenantId", "==", scope.tenantId)
      .where("workspaceId", "==", scope.workspaceId)
      .where("companyId", "==", scope.companyId)
      .get();
    return snap.docs
      .map((doc) => doc.data() as DomainOrder)
      .sort(
        (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
      );
  },

  async get(id, scope) {
    const snap = await getDb().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as DomainOrder;
    return inCrmScope(data, scope) ? data : null;
  },

  async save(order) {
    await getDb().collection(COLLECTION).doc(order.id).set(order);
    return order;
  },
};
