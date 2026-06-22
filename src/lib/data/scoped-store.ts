import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";

export function createScopedMemoryStore<T extends TenantScope & { id: string }>(
  seed: () => T[]
) {
  let items = seed();

  return {
    reset() {
      items = seed();
    },
    list(scope: TenantScope) {
      return items.filter((i) => inCrmScope(i, scope));
    },
    get(id: string, scope: TenantScope) {
      const item = items.find((i) => i.id === id);
      return item && inCrmScope(item, scope) ? item : null;
    },
    set(item: T) {
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx >= 0) items[idx] = item;
      else items.unshift(item);
      return item;
    },
    create(
      input: Omit<T, "id"> & Partial<Pick<T, "id">>,
      idPrefix: string
    ) {
      const item = {
        ...input,
        id: input.id ?? crmNewId(idPrefix),
      } as T;
      items.unshift(item);
      return item;
    },
    remove(id: string, scope: TenantScope) {
      const idx = items.findIndex((i) => i.id === id && inCrmScope(i, scope));
      if (idx === -1) return false;
      items.splice(idx, 1);
      return true;
    },
  };
}

export function createScopedFirestoreStore<T extends TenantScope & { id: string }>(
  collection: string
) {
  function db() {
    const firestore = getAdminFirestore();
    if (!firestore) throw new Error("Firestore is not configured.");
    return firestore;
  }

  async function list(scope: TenantScope) {
    const snap = await db()
      .collection(collection)
      .where("tenantId", "==", scope.tenantId)
      .where("workspaceId", "==", scope.workspaceId)
      .where("companyId", "==", scope.companyId)
      .get();
    return snap.docs.map((doc) => doc.data() as T);
  }

  return {
    list,
    async get(id: string, scope: TenantScope) {
      const snap = await db().collection(collection).doc(id).get();
      if (!snap.exists) return null;
      const data = snap.data() as T;
      return inCrmScope(data, scope) ? data : null;
    },
    async set(item: T) {
      await db().collection(collection).doc(item.id).set(item);
      return item;
    },
    async create(
      input: Omit<T, "id"> & Partial<Pick<T, "id">>,
      idPrefix: string
    ) {
      const item = {
        ...input,
        id: input.id ?? crmNewId(idPrefix),
      } as T;
      await db().collection(collection).doc(item.id).set(item);
      return item;
    },
    async remove(id: string, scope: TenantScope) {
      const existing = await this.get(id, scope);
      if (!existing) return false;
      await db().collection(collection).doc(id).delete();
      return true;
    },
  };
}

export function createScopedRepository<T extends TenantScope & { id: string }>(
  collection: string,
  seed: () => T[]
) {
  const memory = createScopedMemoryStore(seed);
  const firestore = createScopedFirestoreStore<T>(collection);

  return {
    memory,
    firestore,
    collection,
  };
}

export { crmNow, crmNewId };
