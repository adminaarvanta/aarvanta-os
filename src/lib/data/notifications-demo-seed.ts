import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import { crmNow } from "@/lib/data/crm-helpers";
import type { AiDigest, AppNotification } from "@/types/notifications";

const now = crmNow();

export function buildDemoNotifications(): AppNotification[] {
  return [
    {
      ...DEMO_TENANT,
      id: "notif_leads",
      kind: "notification",
      priority: "high",
      title: "15 new leads today",
      body: "Inbound from website chat, email, and WhatsApp. 4 scored above 70.",
      read: false,
      actionUrl: "/crm/leads",
      source: "crm",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "notif_deals",
      kind: "alert",
      priority: "high",
      title: "3 deals require attention",
      body: "Northstar Digital, Meridian Consulting, and Brightpath need follow-up this week.",
      read: false,
      actionUrl: "/crm/pipelines",
      source: "crm",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "notif_revenue",
      kind: "notification",
      priority: "medium",
      title: "Revenue increased 12%",
      body: "Won deals this month vs last month. AI CEO flagged strong pipeline momentum.",
      read: false,
      actionUrl: "/analytics",
      source: "analytics",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "notif_workflow",
      kind: "alert",
      priority: "medium",
      title: "Proposal approval pending",
      body: "Workflow run awaiting your approval for Northstar Digital proposal.",
      read: true,
      actionUrl: "/workflows",
      source: "workflows",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "notif_reminder",
      kind: "reminder",
      priority: "low",
      title: "Follow up with Sarah Chen",
      body: "Scheduled reminder: check Meridian SOW status.",
      read: true,
      actionUrl: "/crm/contacts",
      source: "tasks",
      createdAt: now,
    },
  ];
}

export function buildDemoDigests(): AiDigest[] {
  return [
    {
      ...DEMO_TENANT,
      id: "digest_daily",
      period: "daily",
      headline: "Strong day — pipeline up, 3 deals need your touch",
      highlights: [
        "15 new leads captured across channels",
        "Northstar Digital moved to Proposal stage",
        "2 project tasks overdue on Meridian onboarding",
        "AI Sales Manager recommends calling Sarah Chen today",
      ],
      stats: {
        newLeads: 15,
        dealsNeedAttention: 3,
        revenueChangePct: 12,
        unreadMessages: 7,
      },
      generatedAt: now,
    },
  ];
}
