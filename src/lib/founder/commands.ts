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
