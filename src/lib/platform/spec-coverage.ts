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
          "BDM playbooks: lead score/deal triggers, WhatsApp/email outreach, CRM tags & stages, tasks, meetings, AI assist, approvals.",
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
        href: "/team?tab=hierarchy",
        status: "complete",
        summary:
          "Org → Workspace hierarchy for all users; Owner/Admin/Manager/Member/Guest RBAC; invitations with accept links. Opened from Team.",
      },
      {
        id: "team",
        phase: 6,
        name: "Team",
        href: "/team",
        status: "complete",
        summary:
          "Hierarchy, directory, invitations, roles, notes, and activity. HR People and AI Team remain separate apps.",
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
          "All channels in one place (deep links). Primary UX is WhatsApp OS and Voice OS.",
      },
      {
        id: "whatsapp-os",
        phase: "9b-wa",
        name: "WhatsApp OS",
        href: "/whatsapp",
        status: "partial",
        summary:
          "Production WhatsApp business inbox: start thread, outbound Graph API, inbound webhooks (text + interactive + media placeholders), CRM bridge.",
      },
      {
        id: "voice-os-live",
        phase: "9b-voice",
        name: "Voice OS",
        href: "/voice",
        status: "partial",
        summary:
          "Production AI calling inbox: outbound Twilio with ConversationRelay two-way AI when VOICE_RELAY_WSS_URL points at the EC2 voice-relay sidecar; otherwise one-shot TTS. Call log + dialer.",
      },
      {
        id: "analytics",
        phase: 10,
        name: "Analytics & Reporting",
        href: "/analytics",
        status: "complete",
        summary:
          "Executive dashboard with KPI sparklines, revenue/pipeline charts, funnel breakdowns, ops lists, and CSV export. PDF/Excel remain queued in demo mode.",
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
        summary: "Plans, subscriptions, usage tracking. Stripe Checkout + portal + webhooks.",
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
        status: "planned",
        summary:
          "Removed from product on 2026-08-13 (see docs/DEFERRED_TOOLS_ARCHIVE.md). Entity graph UI not shipped.",
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
        status: "planned",
        summary:
          "Removed from product on 2026-08-13 (see docs/DEFERRED_TOOLS_ARCHIVE.md).",
      },
      {
        id: "analytics-v2",
        phase: 21,
        name: "Analytics 2.0",
        href: "/analytics",
        status: "complete",
        summary:
          "Merged into primary Analytics OS — separate Analytics 2.0 module removed 2026-08-13.",
      },
      {
        id: "templates",
        phase: 22,
        name: "Templates Library",
        status: "planned",
        summary:
          "Removed from product on 2026-08-13 (see docs/DEFERRED_TOOLS_ARCHIVE.md).",
      },
      {
        id: "memory",
        phase: 23,
        name: "Memory Layers",
        status: "planned",
        summary:
          "Removed product shell on 2026-08-13; agent memory remains under Workforce.",
      },
      {
        id: "success",
        phase: 24,
        name: "Customer Success",
        status: "planned",
        summary:
          "Removed from product on 2026-08-13 (see docs/DEFERRED_TOOLS_ARCHIVE.md).",
      },
      {
        id: "wiki",
        phase: 25,
        name: "Internal Wiki",
        status: "planned",
        summary:
          "Removed from product on 2026-08-13 (see docs/DEFERRED_TOOLS_ARCHIVE.md).",
      },
      {
        id: "finance",
        phase: 28,
        name: "Finance OS",
        href: "/finance",
        status: "partial",
        summary:
          "Double-entry ledger, trial balance, P&L, balance sheet, invoices, UK CoA. Xero/QuickBooks hooks planned.",
      },
      {
        id: "payroll",
        phase: "ageb-3",
        name: "Payroll OS",
        href: "/payroll",
        status: "partial",
        summary: "UK PAYE/NI monthly runs, payslips, payroll journal posting.",
      },
      {
        id: "legal",
        phase: "ageb-3",
        name: "Legal OS",
        status: "planned",
        summary:
          "Product page/API removed 2026-08-13; analyze helpers may remain in lib for Launch.",
      },
      {
        id: "hr",
        phase: 29,
        name: "HR OS",
        href: "/hr",
        status: "partial",
        summary:
          "Full lifecycle: jobs, ATS, native onboarding packs, employees, punch, attendance, leave, documents, invoices, exit.",
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
        status: "planned",
        summary:
          "Removed from product on 2026-08-13 (see docs/DEFERRED_TOOLS_ARCHIVE.md).",
      },
      {
        id: "autonomous",
        phase: 30,
        name: "Autonomous AI Workforce",
        href: "/workforce/jobs",
        status: "partial",
        summary: "Goal-first pipeline: Goal Engine → Plan → Context → Orchestrator → Approvals → Report.",
      },
      {
        id: "sso",
        phase: 31,
        name: "Enterprise SSO",
        href: "/sso",
        status: "partial",
        summary: "OIDC start/callback flow, connection registry, SCIM flags. IdP credentials required for live sign-in.",
      },
      {
        id: "franchise",
        phase: 32,
        name: "Franchise OS",
        status: "planned",
        summary:
          "Removed from product on 2026-08-13 (see docs/DEFERRED_TOOLS_ARCHIVE.md).",
      },
      {
        id: "regions",
        phase: 33,
        name: "Multi-Region",
        status: "planned",
        summary:
          "Removed from product on 2026-08-13 (see docs/DEFERRED_TOOLS_ARCHIVE.md).",
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
    id: "ageb-2",
    label: "AGEB 2.0 — Global Blueprint",
    modules: [
      {
        id: "build-os",
        phase: "siteos-1",
        name: "Build OS",
        href: "/build",
        status: "partial",
        summary:
          "Category → template → brief wizard; dense multi-page sites from template recipes; OpenAI fill + Unsplash/picsum media; theme refine; domain/hosting checkout. Deploy of static HTML still bypassed.",
      },
      {
        id: "launch-os",
        phase: 11,
        name: "Launch OS",
        href: "/launch",
        status: "complete",
        summary:
          "Full M1 flow: domain, logo, legal drafts, UK CoA, store page, Firestore persistence, industry dashboard.",
      },
      {
        id: "ageb-engines",
        phase: 3,
        name: "Core Engines",
        status: "planned",
        summary:
          "Product page removed 2026-08-13; engine registry may still exist in platform libs.",
      },
      {
        id: "business-action-api",
        phase: 8,
        name: "Business Action API",
        href: "/api/v1/action/execute",
        status: "partial",
        summary:
          "17 intents: CRM, finance ledger, payroll, legal, HR, workflows, industry KPIs, Launch OS, AI buddies.",
      },
      {
        id: "intelligence-fabric",
        phase: 5,
        name: "Intelligence Fabric",
        status: "partial",
        summary:
          "Buddy routing with engine dispatch to finance, payroll, and legal engines.",
      },
      {
        id: "ai-buddy-framework",
        phase: 5,
        name: "AI Buddy Framework",
        href: "/workforce",
        status: "partial",
        summary:
          "10 role-based buddies mapped to workforce agents with domain tools and permissions model.",
      },
      {
        id: "industry-os",
        phase: 10,
        name: "Industry OS",
        status: "partial",
        summary:
          "Industry profiles drive Launch OS, buddy assignment, and dashboard KPI panels (retail, services, hospitality, etc.).",
      },
      {
        id: "ageb-blueprint",
        phase: 15,
        name: "AGEB Blueprint Hub",
        status: "planned",
        summary:
          "Product page removed 2026-08-13; AGEB libraries remain for Launch OS.",
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
        name: "Voice Operating System (extended)",
        status: "partial",
        href: "/voice",
        summary:
          "Calling inbox and Twilio TTS live. Voice-first business control still planned.",
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
        name: "Partners",
        status: "partial",
        href: "/partners",
        summary:
          "One partner hub for customer opt-in and enrolled dashboards. Tracking, CPA + commission ledger, regional caps, payouts. See docs/AFFILIATE_PRD.md.",
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
