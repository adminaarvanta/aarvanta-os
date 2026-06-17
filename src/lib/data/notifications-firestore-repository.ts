import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { NotificationsRepository } from "@/lib/data/notifications-repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import type { AiDigest, AppNotification } from "@/types/notifications";

const NOTIFICATIONS = "app_notifications";
const DIGESTS = "ai_digests";

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

export const notificationsFirestoreRepository: NotificationsRepository = {
  async listNotifications(scope) {
    const items = await listScoped<AppNotification>(NOTIFICATIONS, scope);
    return items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async markRead(id, scope) {
    const snap = await getDb().collection(NOTIFICATIONS).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as AppNotification;
    if (!inCrmScope(data, scope)) return null;
    const updated = { ...data, read: true };
    await getDb().collection(NOTIFICATIONS).doc(id).set(updated);
    return updated;
  },

  async markAllRead(scope) {
    const items = await this.listNotifications(scope);
    let count = 0;
    for (const item of items) {
      if (!item.read) {
        await getDb()
          .collection(NOTIFICATIONS)
          .doc(item.id)
          .set({ ...item, read: true });
        count += 1;
      }
    }
    return count;
  },

  async getLatestDigest(scope) {
    const items = await listScoped<AiDigest>(DIGESTS, scope);
    return items.sort(
      (a, b) =>
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    )[0] ?? null;
  },

  async createNotification(input, scope) {
    const item: AppNotification = {
      ...scope,
      ...input,
      id: crmNewId("notif"),
      read: false,
      createdAt: crmNow(),
    };
    await getDb().collection(NOTIFICATIONS).doc(item.id).set(item);
    return item;
  },
};
