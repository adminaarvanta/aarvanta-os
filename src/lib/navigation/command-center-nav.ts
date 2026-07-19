import {
  BarChart3,
  Briefcase,
  Brain,
  Globe2,
  Kanban,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  MessageCircle,
  Phone,
  Sparkles,
  Wallet,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CommandNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "whatsapp" | "voice";
};

export type OperatingSystemItem = {
  id: string;
  label: string;
  href: string;
  /** Theme-safe token classes (not fixed light-only Tailwind hues) */
  dotClass: string;
  iconClass: string;
  description?: string;
};

/** Primary sidebar navigation — Command Center design */
export const COMMAND_CENTER_NAV: CommandNavItem[] = [
  { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { href: "/whatsapp", label: "WhatsApp OS", icon: MessageCircle, badgeKey: "whatsapp" },
  { href: "/voice", label: "Voice OS", icon: Phone, badgeKey: "voice" },
  { href: "/crm", label: "CRM", icon: Briefcase },
  { href: "/workforce", label: "AI Workforce", icon: Sparkles },
  { href: "/projects", label: "Projects", icon: Kanban },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/hr", label: "HR", icon: Landmark },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "#all-tools", label: "All Tools", icon: LayoutGrid },
];

/**
 * Sidebar shortcuts — unique destinations not already in primary nav.
 */
export const SIDEBAR_SHORTCUTS: OperatingSystemItem[] = [
  {
    id: "leads",
    label: "Lead pipeline",
    href: "/crm/leads",
    description: "Capture and qualify new leads",
    dotClass: "bg-gold",
    iconClass: "text-gold bg-gold/10",
  },
  {
    id: "build",
    label: "Build sites",
    href: "/build",
    description: "Create and publish websites",
    dotClass: "bg-accent-cyan",
    iconClass: "text-accent-cyan bg-accent-cyan/10",
  },
  {
    id: "knowledge",
    label: "Knowledge hub",
    href: "/knowledge",
    description: "Docs, FAQs, and company brain",
    dotClass: "bg-primary-bright",
    iconClass: "text-primary-bright bg-primary-soft",
  },
  {
    id: "organization",
    label: "Organization",
    href: "/organization",
    description: "Hierarchy & user roles",
    dotClass: "bg-gold",
    iconClass: "text-gold bg-gold/10",
  },
  {
    id: "team",
    label: "Team",
    href: "/team",
    description: "People and collaboration",
    dotClass: "bg-success",
    iconClass: "text-success bg-success/10",
  },
];

/**
 * Dashboard OS map — branded modules.
 */
export const OPERATING_SYSTEMS: OperatingSystemItem[] = [
  {
    id: "lead",
    label: "LeadOS",
    href: "/crm/leads",
    description: "Lead capture & qualification",
    dotClass: "bg-gold",
    iconClass: "text-gold bg-gold/10",
  },
  {
    id: "crm",
    label: "CRMOS",
    href: "/crm",
    description: "Customers, deals & pipelines",
    dotClass: "bg-accent-cyan",
    iconClass: "text-accent-cyan bg-accent-cyan/10",
  },
  {
    id: "whatsapp",
    label: "WhatsApp OS",
    href: "/whatsapp",
    description: "WhatsApp business messaging",
    dotClass: "bg-success",
    iconClass: "text-success bg-success/10",
  },
  {
    id: "voice",
    label: "Voice OS",
    href: "/voice",
    description: "AI calling & call log",
    dotClass: "bg-primary-bright",
    iconClass: "text-primary-bright bg-primary-soft",
  },
  {
    id: "site",
    label: "Build OS",
    href: "/build",
    description: "Websites & landing pages",
    dotClass: "bg-gold-dark",
    iconClass: "text-gold-dark bg-gold/10",
  },
  {
    id: "analytics",
    label: "AnalyticsOS",
    href: "/analytics",
    description: "Reports & performance",
    dotClass: "bg-gold",
    iconClass: "text-gold bg-gold/10",
  },
  {
    id: "content",
    label: "ContentOS",
    href: "/knowledge",
    description: "Knowledge & content",
    dotClass: "bg-accent-cyan",
    iconClass: "text-accent-cyan bg-accent-cyan/10",
  },
  {
    id: "finance",
    label: "FinanceOS",
    href: "/finance",
    description: "Billing & cashflow",
    dotClass: "bg-accent-cyan",
    iconClass: "text-accent-cyan bg-accent-cyan/10",
  },
];

/** Mobile bottom bar — keep lean; deeper tools via sidebar shortcuts on desktop */
export const MOBILE_NAV: CommandNavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, badgeKey: "whatsapp" },
  { href: "/voice", label: "Voice", icon: Phone, badgeKey: "voice" },
  { href: "/crm", label: "CRM", icon: Briefcase },
  { href: "/workforce", label: "AI", icon: Sparkles },
  { href: "/projects", label: "Projects", icon: Kanban },
  { href: "/knowledge", label: "Knowledge", icon: Brain },
];

export const SIDEBAR_BRAND = {
  title: "AARVANTA",
  subtitle: "BUSINESS OS",
  href: "/dashboard",
  icon: Globe2,
};
