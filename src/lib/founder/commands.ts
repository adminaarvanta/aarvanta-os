import type { FounderCommand } from "@/types/founder";

export const FOUNDER_COMMANDS: FounderCommand[] = [
  {
    id: "open_dashboard",
    label: "Open Founder Dashboard",
    keywords: ["dashboard", "home", "overview", "command"],
    href: "/dashboard",
    group: "Navigate",
  },
  {
    id: "open_inbox",
    label: "Open Unified Inbox",
    keywords: ["inbox", "messages", "chat", "email"],
    href: "/inbox",
    group: "Navigate",
  },
  {
    id: "open_crm",
    label: "Open CRM",
    keywords: ["crm", "contacts", "customers"],
    href: "/crm",
    group: "Navigate",
  },
  {
    id: "open_leads",
    label: "Open Leads",
    keywords: ["leads", "prospects", "pipeline"],
    href: "/crm/leads",
    group: "Navigate",
  },
  {
    id: "open_pipelines",
    label: "Open Deal Pipelines",
    keywords: ["deals", "pipeline", "opportunities"],
    href: "/crm/pipelines",
    group: "Navigate",
  },
  {
    id: "open_workforce",
    label: "Open AI Workforce",
    keywords: ["ai", "agents", "workforce", "employees"],
    href: "/workforce",
    group: "Navigate",
  },
  {
    id: "open_knowledge",
    label: "Open Knowledge Hub",
    keywords: ["knowledge", "docs", "brain", "sop"],
    href: "/knowledge",
    group: "Navigate",
  },
  {
    id: "open_projects",
    label: "Open Projects",
    keywords: ["projects", "kanban", "tasks"],
    href: "/projects",
    group: "Navigate",
  },
  {
    id: "open_workflows",
    label: "Open Workflows",
    keywords: ["workflows", "automation", "flows"],
    href: "/workflows",
    group: "Navigate",
  },
  {
    id: "open_team",
    label: "Open Team",
    keywords: ["team", "directory", "collaboration", "notes"],
    href: "/team",
    group: "Navigate",
  },
  {
    id: "open_integrations",
    label: "Open Integrations",
    keywords: ["integrations", "gmail", "slack", "stripe", "connect"],
    href: "/integrations",
    group: "Navigate",
  },
  {
    id: "open_communications",
    label: "Open Communications",
    keywords: ["notifications", "alerts", "digest", "communications"],
    href: "/communications",
    group: "Navigate",
  },
  {
    id: "open_analytics",
    label: "Open Analytics",
    keywords: ["analytics", "reports", "revenue", "metrics"],
    href: "/analytics",
    group: "Navigate",
  },
  {
    id: "open_settings",
    label: "Open Settings",
    keywords: ["settings", "organization", "workspace", "rbac"],
    href: "/settings",
    group: "Navigate",
  },
  {
    id: "open_platform",
    label: "Open All Modules",
    keywords: ["platform", "modules", "hub"],
    href: "/platform",
    group: "Navigate",
  },
  {
    id: "open_billing",
    label: "Open Billing",
    keywords: ["billing", "subscription", "plans", "stripe"],
    href: "/billing",
    group: "Navigate",
  },
  {
    id: "open_writing",
    label: "Open AI Writing Studio",
    keywords: ["writing", "content", "blog", "email", "linkedin"],
    href: "/writing",
    group: "Navigate",
  },
  {
    id: "open_finance",
    label: "Open Finance OS",
    keywords: ["finance", "invoices", "expenses", "cfo"],
    href: "/finance",
    group: "Navigate",
  },
  {
    id: "open_hr",
    label: "Open HR OS",
    keywords: ["hr", "recruitment", "ats", "employees"],
    href: "/hr",
    group: "Navigate",
  },
  {
    id: "open_marketplace",
    label: "Open Agent Marketplace",
    keywords: ["marketplace", "agents", "install"],
    href: "/marketplace",
    group: "Navigate",
  },
  {
    id: "open_platform_coverage",
    label: "View Roadmap Coverage",
    keywords: ["coverage", "roadmap", "spec", "os-new", "modules"],
    href: "/platform/coverage",
    group: "Navigate",
  },
  {
    id: "run_demo",
    label: "Run 90-Second Demo",
    keywords: ["demo", "journey", "present", "pitch", "90 second"],
    href: "/dashboard?help=live",
    group: "Quick actions",
  },
  {
    id: "create_lead",
    label: "Create Lead",
    keywords: ["create", "lead", "new lead", "prospect"],
    href: "/crm/leads",
    group: "Quick actions",
  },
  {
    id: "create_project",
    label: "Create Project",
    keywords: ["create", "project", "new project"],
    href: "/projects",
    group: "Quick actions",
  },
  {
    id: "generate_proposal",
    label: "Generate Proposal",
    keywords: ["proposal", "generate", "quote", "sales"],
    href: "/proposals",
    group: "Quick actions",
  },
];

export function filterCommands(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return FOUNDER_COMMANDS;

  return FOUNDER_COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.includes(q) || q.includes(k))
  );
}
