import type { TenantScope } from "@/types/communication";

export type NotificationKind = "alert" | "notification" | "reminder";

export type NotificationPriority = "low" | "medium" | "high";

export interface AppNotification extends TenantScope {
  id: string;
  kind: NotificationKind;
  priority: NotificationPriority;
  title: string;
  body: string;
  read: boolean;
  actionUrl?: string;
  source?: string;
  createdAt: string;
}

export interface AiDigest extends TenantScope {
  id: string;
  period: "daily" | "weekly";
  headline: string;
  highlights: string[];
  stats: {
    newLeads?: number;
    dealsNeedAttention?: number;
    revenueChangePct?: number;
    unreadMessages?: number;
  };
  generatedAt: string;
}
