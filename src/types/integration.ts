export type IntegrationProvider =
  | "gmail"
  | "outlook"
  | "google_calendar"
  | "google_drive"
  | "slack"
  | "whatsapp_cloud"
  | "stripe";

export type IntegrationStatus = "connected" | "disconnected" | "error" | "syncing";

export interface IntegrationDefinition {
  provider: IntegrationProvider;
  name: string;
  description: string;
  category: "email" | "calendar" | "storage" | "messaging" | "payments";
}

export interface IntegrationConnection {
  id: string;
  tenantId: string;
  workspaceId: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  accountLabel?: string;
  lastSyncAt?: string;
  lastSyncError?: string;
  connectedAt?: string;
  disconnectedAt?: string;
  metadata?: Record<string, string>;
}
