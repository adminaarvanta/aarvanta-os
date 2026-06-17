import type { TenantScope } from "@/types/communication";
import type { AiDigest, AppNotification } from "@/types/notifications";

export interface NotificationsRepository {
  listNotifications(scope: TenantScope): Promise<AppNotification[]>;
  markRead(id: string, scope: TenantScope): Promise<AppNotification | null>;
  markAllRead(scope: TenantScope): Promise<number>;
  getLatestDigest(scope: TenantScope): Promise<AiDigest | null>;
  createNotification(
    input: Omit<AppNotification, keyof TenantScope | "id" | "createdAt" | "read">,
    scope: TenantScope
  ): Promise<AppNotification>;
}
