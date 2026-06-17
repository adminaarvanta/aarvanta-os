import { DEMO_ORG_AARVANTA, DEMO_WS_AARVANTA_MAIN } from "@/lib/data/tenant-demo-seed";
import { crmNow } from "@/lib/data/crm-helpers";
import type { IntegrationConnection } from "@/types/integration";

const now = crmNow();

export function buildDemoIntegrations(): IntegrationConnection[] {
  return [
    {
      id: "int_gmail",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_MAIN,
      provider: "gmail",
      status: "connected",
      accountLabel: "pavan@aarvanta.com",
      lastSyncAt: now,
      connectedAt: now,
    },
    {
      id: "int_calendar",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_MAIN,
      provider: "google_calendar",
      status: "connected",
      accountLabel: "pavan@aarvanta.com",
      lastSyncAt: now,
      connectedAt: now,
    },
    {
      id: "int_slack",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_MAIN,
      provider: "slack",
      status: "connected",
      accountLabel: "Aarvanta Workspace",
      lastSyncAt: now,
      connectedAt: now,
    },
    {
      id: "int_whatsapp",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_MAIN,
      provider: "whatsapp_cloud",
      status: "connected",
      accountLabel: "+44 7700 900123",
      lastSyncAt: now,
      connectedAt: now,
    },
    {
      id: "int_stripe",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_MAIN,
      provider: "stripe",
      status: "connected",
      accountLabel: "acct_aarvanta_demo",
      lastSyncAt: now,
      connectedAt: now,
    },
    {
      id: "int_outlook",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_MAIN,
      provider: "outlook",
      status: "disconnected",
    },
    {
      id: "int_drive",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_MAIN,
      provider: "google_drive",
      status: "syncing",
      accountLabel: "pavan@aarvanta.com",
      lastSyncAt: now,
      connectedAt: now,
    },
  ];
}

export const INTEGRATION_DEFINITIONS = [
  {
    provider: "gmail" as const,
    name: "Gmail",
    description: "Sync email threads into Unified Inbox",
    category: "email" as const,
  },
  {
    provider: "outlook" as const,
    name: "Outlook",
    description: "Microsoft 365 email integration",
    category: "email" as const,
  },
  {
    provider: "google_calendar" as const,
    name: "Google Calendar",
    description: "Meeting sync and scheduling",
    category: "calendar" as const,
  },
  {
    provider: "google_drive" as const,
    name: "Google Drive",
    description: "Document sync for Knowledge Hub",
    category: "storage" as const,
  },
  {
    provider: "slack" as const,
    name: "Slack",
    description: "Team notifications and alerts",
    category: "messaging" as const,
  },
  {
    provider: "whatsapp_cloud" as const,
    name: "WhatsApp Cloud API",
    description: "Customer messaging channel",
    category: "messaging" as const,
  },
  {
    provider: "stripe" as const,
    name: "Stripe",
    description: "Payments and subscription billing",
    category: "payments" as const,
  },
];
