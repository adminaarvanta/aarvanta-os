export type CoverageStatus = "complete" | "partial" | "planned";

export type SpecModule = {
  id: string;
  phase: number | string;
  name: string;
  href?: string;
  status: CoverageStatus;
  summary: string;
};

/** Roadmap alignment vs os-new.txt — updated as modules ship. */
export const SPEC_PHASES: Array<{
  id: string;
  label: string;
  modules: SpecModule[];
}> = [
  {
    id: "phase-1",
    label: "Phase 1 — MVP",
    modules: [
      {
        id: "workforce",
        phase: 1,
        name: "AI Workforce",
        href: "/workforce",
        status: "complete",
        summary:
          "7 AI employees with profiles, memory, chat, tasks, runs, shared memory, and collaboration.",
      },
      {
        id: "knowledge",
        phase: 2,
        name: "Knowledge Hub",
        href: "/knowledge",
        status: "complete",
        summary: "PDF/DOCX/TXT upload, semantic search, RAG Ask, tags, summaries.",
      },
      {
        id: "crm",
        phase: 3,
        name: "CRM",
        href: "/crm",
        status: "complete",
        summary:
          "Leads, contacts, companies, deals, pipelines, AI lead scoring, inbound qualification.",
      },
      {
        id: "launch",
        phase: 4,
        name: "Polish & Launch",
        href: "/",
        status: "complete",
        summary: "Marketing site, pricing, about, contact, demo data, 90-second journey.",
      },
      {
        id: "projects",
        phase: "1b",
        name: "Project OS",
        href: "/projects",
        status: "partial",
        summary: "Kanban boards and tasks live. Gantt/Scrum views planned.",
      },
      {
        id: "workflows",
        phase: "1c",
        name: "Workflow Automation",
        href: "/workflows",
        status: "partial",
        summary:
          "Trigger → condition → agent → approval → action. Template workflows; visual drag-drop builder planned.",
      },
      {
        id: "founder",
        phase: 12,
        name: "Founder Dashboard & Copilot",
        href: "/dashboard",
        status: "complete",
        summary: "Business pulse, Copilot chat, daily briefing, ⌘K command bar.",
      },
    ] as SpecModule[],
  },
  {
    id: "phase-1-ext",
    label: "Phase 1 — Platform foundation",
    modules: [
      {
        id: "multi-tenant",
        phase: 5,
        name: "Multi-Tenant",
        href: "/settings",
        status: "complete",
        summary: "Organizations, workspaces, invitations, RBAC roles.",
      },
      {
        id: "team",
        phase: 6,
        name: "Team Collaboration",
        href: "/team",
        status: "partial",
        summary:
          "Directory, notes, comments, @mentions, activity feed, internal channels (demo). Slack-style DMs/voice planned.",
      },
      {
        id: "integrations",
        phase: 8,
        name: "Integrations Hub",
        href: "/integrations",
        status: "partial",
        summary: "Connect/disconnect/sync UI. Real OAuth provider hooks planned.",
      },
      {
        id: "communications",
        phase: 9,
        name: "Communication Center",
        href: "/communications",
        status: "complete",
        summary: "Notifications, alerts, AI digest.",
      },
      {
        id: "inbox",
        phase: "9b",
        name: "Unified Inbox",
        href: "/inbox",
        status: "partial",
        summary:
          "WhatsApp, email, SMS, voice, website chat. Live when provider webhooks configured.",
      },
      {
        id: "analytics",
        phase: 10,
        name: "Analytics & Reporting",
        href: "/analytics",
        status: "partial",
        summary: "Dashboards and CSV export live. PDF/Excel export queued in demo mode.",
      },
    ] as SpecModule[],
  },
  {
    id: "phase-2",
    label: "Phase 2 — Revenue & operations modules",
    modules: [
      {
        id: "billing",
        phase: 11,
        name: "Billing Foundation",
        href: "/billing",
        status: "partial",
        summary: "Plans, subscriptions, usage tracking. Stripe live integration planned.",
      },
      {
        id: "writing",
        phase: 13,
        name: "AI Writing Studio",
        href: "/writing",
        status: "partial",
        summary: "Proposals, emails, blogs, LinkedIn, SOPs, meeting notes with AI generation.",
      },
      {
        id: "meetings",
        phase: 14,
        name: "Meeting Intelligence",
        href: "/meetings",
        status: "partial",
        summary: "Transcript upload, summaries, tasks, follow-ups.",
      },
      {
        id: "knowledge-graph",
        phase: 15,
        name: "Knowledge Graph",
        href: "/knowledge/graph",
        status: "partial",
        summary: "Entity relationships and source references with demo graph.",
      },
      {
        id: "sops",
        phase: 18,
        name: "SOP Engine",
        href: "/sops",
        status: "partial",
        summary: "Create, store, version SOPs. Execution workflows expanding.",
      },
      {
        id: "proposals",
        phase: 19,
        name: "Proposal Engine",
        href: "/proposals",
        status: "partial",
        summary: "Proposal builder, branding, export. E-signatures planned.",
      },
      {
        id: "portal",
        phase: 20,
        name: "Client Portal",
        href: "/portal",
        status: "partial",
        summary: "Portal access records and project links. Customer-facing login planned.",
      },
      {
        id: "analytics-v2",
        phase: 21,
        name: "Analytics 2.0",
        href: "/analytics/v2",
        status: "partial",
        summary: "Revenue, sales, ops, and AI workforce dashboards.",
      },
      {
        id: "templates",
        phase: 22,
        name: "Templates Library",
        href: "/templates",
        status: "partial",
        summary: "Proposals, SOPs, campaigns, workflows, contracts.",
      },
      {
        id: "memory",
        phase: 23,
        name: "Memory Layers",
        href: "/memory",
        status: "partial",
        summary: "User, team, company, and customer memory layers.",
      },
      {
        id: "success",
        phase: 24,
        name: "Customer Success",
        href: "/success",
        status: "partial",
        summary: "Health scores, renewals, NPS, churn signals. Ticketing desk planned.",
      },
      {
        id: "wiki",
        phase: 25,
        name: "Internal Wiki",
        href: "/wiki",
        status: "partial",
        summary: "Handbook, department knowledge, training content.",
      },
      {
        id: "finance",
        phase: 28,
        name: "Finance OS",
        href: "/finance",
        status: "partial",
        summary: "Invoices, expenses, budgets. Xero/QuickBooks/Stripe hooks planned.",
      },
      {
        id: "hr",
        phase: 29,
        name: "HR OS",
        href: "/hr",
        status: "partial",
        summary: "ATS, employees, courses. Performance reviews and leave management planned.",
      },
    ] as SpecModule[],
  },
  {
    id: "phase-3",
    label: "Phase 3 — Enterprise & autonomous",
    modules: [
      {
        id: "governance",
        phase: 26,
        name: "Governance & Security",
        href: "/governance",
        status: "partial",
        summary: "Audit trail, activity logs, permissions. MFA/compliance dashboard planned.",
      },
      {
        id: "autonomous",
        phase: 30,
        name: "Autonomous AI Workforce",
        href: "/workforce/autonomous",
        status: "partial",
        summary: "Planning, delegation, task queue, agent hierarchy.",
      },
      {
        id: "sso",
        phase: 31,
        name: "Enterprise SSO",
        href: "/sso",
        status: "planned",
        summary: "SAML, OIDC, OAuth, SCIM — configuration UI scaffolded.",
      },
      {
        id: "franchise",
        phase: 32,
        name: "Franchise OS",
        href: "/franchise",
        status: "partial",
        summary: "Multi-location performance and compliance dashboard.",
      },
      {
        id: "regions",
        phase: 33,
        name: "Multi-Region",
        href: "/regions",
        status: "planned",
        summary: "Regional config and data residency blueprint.",
      },
      {
        id: "marketplace",
        phase: 34,
        name: "Agent Marketplace",
        href: "/marketplace",
        status: "partial",
        summary: "Discover and install agent packs. Publisher workflow planned.",
      },
    ] as SpecModule[],
  },
  {
    id: "future",
    label: "Future layers (os-new.txt vision)",
    modules: [
      {
        id: "internal-chat",
        phase: "L8",
        name: "Internal Company Chat",
        status: "partial",
        summary: "Team channels demo. Full Slack-style DMs, voice, and video planned.",
      },
      {
        id: "voice-os",
        phase: "L16",
        name: "Voice Operating System",
        status: "planned",
        summary: "Voice-first business control and AI calling.",
      },
      {
        id: "digital-twin",
        phase: "L20",
        name: "Business Digital Twin",
        status: "planned",
        summary: "Company simulation and scenario planning.",
      },
      {
        id: "learning-academy",
        phase: "L14",
        name: "Learning Academy",
        status: "planned",
        summary: "Certifications, partner training, skill tracking.",
      },
      {
        id: "esign",
        phase: "L10",
        name: "E-Signatures",
        status: "planned",
        summary: "Sign contracts and proposals inside the platform.",
      },
      {
        id: "partner-affiliate",
        phase: "GTM",
        name: "Partner & Affiliate System",
        status: "planned",
        summary: "Referral links, commission tracking, payout reports.",
      },
    ] as SpecModule[],
  },
];

export function coverageStats() {
  const modules = SPEC_PHASES.flatMap((p) => p.modules);
  return {
    total: modules.length,
    complete: modules.filter((m) => m.status === "complete").length,
    partial: modules.filter((m) => m.status === "partial").length,
    planned: modules.filter((m) => m.status === "planned").length,
  };
}
