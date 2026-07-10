import {
  BarChart3,
  Briefcase,
  Globe2,
  Inbox,
  Kanban,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  Sparkles,
  Wallet,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CommandNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "inbox";
};

export type OperatingSystemItem = {
  id: string;
  label: string;
  href: string;
  dotClass: string;
  iconClass: string;
};

/** Primary sidebar navigation — Command Center design */
export const COMMAND_CENTER_NAV: CommandNavItem[] = [
  { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox, badgeKey: "inbox" },
  { href: "/crm", label: "CRM", icon: Briefcase },
  { href: "/workforce", label: "AI Workforce", icon: Sparkles },
  { href: "/projects", label: "Projects", icon: Kanban },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/hr", label: "HR", icon: Landmark },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "#all-tools", label: "All Tools", icon: LayoutGrid },
];

/** Operating Systems section in sidebar + dashboard grid */
export const OPERATING_SYSTEMS: OperatingSystemItem[] = [
  {
    id: "lead",
    label: "LeadOS",
    href: "/crm/leads",
    dotClass: "bg-orange-500",
    iconClass: "text-orange-500 bg-orange-50",
  },
  {
    id: "crm",
    label: "CRMOS",
    href: "/crm",
    dotClass: "bg-blue-500",
    iconClass: "text-blue-600 bg-blue-50",
  },
  {
    id: "voice",
    label: "VoiceOS",
    href: "/inbox",
    dotClass: "bg-violet-500",
    iconClass: "text-violet-600 bg-violet-50",
  },
  {
    id: "whatsapp",
    label: "WhatsAppOS",
    href: "/inbox",
    dotClass: "bg-green-500",
    iconClass: "text-green-600 bg-green-50",
  },
  {
    id: "site",
    label: "SiteOS",
    href: "/launch",
    dotClass: "bg-cyan-500",
    iconClass: "text-cyan-600 bg-cyan-50",
  },
  {
    id: "analytics",
    label: "AnalyticsOS",
    href: "/analytics",
    dotClass: "bg-indigo-500",
    iconClass: "text-indigo-600 bg-indigo-50",
  },
  {
    id: "content",
    label: "ContentOS",
    href: "/knowledge",
    dotClass: "bg-pink-500",
    iconClass: "text-pink-600 bg-pink-50",
  },
  {
    id: "finance",
    label: "FinanceOS",
    href: "/finance",
    dotClass: "bg-emerald-500",
    iconClass: "text-emerald-600 bg-emerald-50",
  },
];

export const SIDEBAR_BRAND = {
  title: "AARVANTA",
  subtitle: "BUSINESS OS",
  href: "/dashboard",
  icon: Globe2,
};
