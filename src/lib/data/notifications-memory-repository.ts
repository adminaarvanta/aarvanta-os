import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import {
  buildDemoDigests,
  buildDemoNotifications,
} from "@/lib/data/notifications-demo-seed";
import type { NotificationsRepository } from "@/lib/data/notifications-repository";

let notifications = buildDemoNotifications();
let digests = buildDemoDigests();

export const notificationsMemoryRepository: NotificationsRepository = {
  async listNotifications(scope) {
    return notifications
      .filter((n) => inCrmScope(n, scope))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  async markRead(id, scope) {
    const idx = notifications.findIndex(
      (n) => n.id === id && inCrmScope(n, scope)
    );
    if (idx === -1) return null;
    notifications[idx] = { ...notifications[idx], read: true };
    return notifications[idx];
  },

  async markAllRead(scope) {
    let count = 0;
    notifications = notifications.map((n) => {
      if (inCrmScope(n, scope) && !n.read) {
        count += 1;
        return { ...n, read: true };
      }
      return n;
    });
    return count;
  },

  async getLatestDigest(scope) {
    return (
      digests.find((d) => inCrmScope(d, scope)) ??
      null
    );
  },

  async createNotification(input, scope) {
    const item = {
      ...scope,
      ...input,
      id: crmNewId("notif"),
      read: false,
      createdAt: crmNow(),
    };
    notifications.unshift(item);
    return item;
  },
};

export function resetNotificationsMemory() {
  notifications = buildDemoNotifications();
  digests = buildDemoDigests();
}
