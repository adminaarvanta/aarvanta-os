import { inCrmScope, crmNewId } from "@/lib/data/crm-helpers";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { EventRepository } from "@/lib/data/event-repository";
import type { TenantScope } from "@/types/communication";
import type { DomainEvent, ListDomainEventsFilters } from "@/types/events";

const COLLECTION = "domain_events";

function db() {
  const firestore = getAdminFirestore();
  if (!firestore) throw new Error("Firestore is not configured.");
  return firestore;
}

export const eventFirestoreRepository: EventRepository = {
  async append(event) {
    const id = event.id || crmNewId("evt");
    const record = { ...event, id };
    await db().collection(COLLECTION).doc(id).set(record);
    return record;
  },

  async list(scope, filters) {
    const limit = filters?.limit ?? 100;
    const snap = await db()
      .collection(COLLECTION)
      .where("tenantId", "==", scope.tenantId)
      .where("workspaceId", "==", scope.workspaceId)
      .where("companyId", "==", scope.companyId)
      .get();

    let items = snap.docs.map((doc) => doc.data() as DomainEvent);

    if (filters?.type) {
      items = items.filter((event) => event.type === filters.type);
    }
    if (filters?.entityType) {
      items = items.filter((event) => event.entityType === filters.entityType);
    }
    if (filters?.entityId) {
      items = items.filter((event) => event.entityId === filters.entityId);
    }

    return items
      .filter((event) => inCrmScope(event, scope))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  },

  async get(id, scope) {
    const snap = await db().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    const event = snap.data() as DomainEvent;
    return inCrmScope(event, scope) ? event : null;
  },
};
