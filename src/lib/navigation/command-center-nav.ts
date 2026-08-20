import {
  BarChart3,
  Briefcase,
  Brain,
  Globe2,
  Handshake,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  Phone,
  Settings,
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
  /** Plan feature key; omit for always-visible items. */
  featureKey?:
    | "crm"
    | "whatsappChannel"
    | "voiceAi"
    | "aiWorkforce"
    | "projects"
    | "workflows"
    | "hr"
    | "finance"
    | "analytics"
    | "ungated";
};

export type OperatingSystemItem = {
  id: string;
  label: string;
  href: string;
  /** Theme-safe token classes (not fixed light-only Tailwind hues) */
  dotClass: string;
  iconClass: string;
  description?: string;
  featureKey?: CommandNavItem["featureKey"];
};

/** Primary sidebar navigation — Command Center design */
export const COMMAND_CENTER_NAV: CommandNavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, featureKey: "ungated" },
  { href: "/voice", label: "Voice", icon: Phone, badgeKey: "voice", featureKey: "voiceAi" },
  { href: "/crm", label: "CRM", icon: Briefcase, featureKey: "crm" },
  { href: "/workforce", label: "AI Team", icon: Sparkles, featureKey: "aiWorkforce" },
  { href: "/workflows", label: "Automations", icon: Workflow, featureKey: "workflows" },
  { href: "/hr", label: "People", icon: Landmark, featureKey: "hr" },
  { href: "/analytics", label: "Insights", icon: BarChart3, featureKey: "analytics" },
  { href: "#all-tools", label: "More", icon: LayoutGrid, featureKey: "ungated" },
];

/**
 * Sidebar shortcuts — unique destinations not already in primary nav.
 */
export const SIDEBAR_SHORTCUTS: OperatingSystemItem[] = [
  {
    id: "leads",
    label: "Leads",
    href: "/crm/leads",
    description: "Capture and qualify new leads",
    dotClass: "bg-gold",
    iconClass: "text-gold bg-gold/10",
    featureKey: "crm",
  },
  {
    id: "build",
    label: "Website Builder",
    href: "/build",
    description: "Create and publish websites",
    dotClass: "bg-accent-cyan",
    iconClass: "text-accent-cyan bg-accent-cyan/10",
    featureKey: "ungated",
  },
  {
    id: "knowledge",
    label: "Knowledge hub",
    href: "/knowledge",
    description: "Docs, FAQs, and company brain",
    dotClass: "bg-primary-bright",
    iconClass: "text-primary-bright bg-primary-soft",
    featureKey: "ungated",
  },
  {
    id: "organization",
    label: "Organization",
    href: "/organization",
    description: "Hierarchy & user roles",
    dotClass: "bg-gold",
    iconClass: "text-gold bg-gold/10",
    featureKey: "ungated",
  },
  {
    id: "team",
    label: "Team",
    href: "/team",
    description: "People and collaboration",
    dotClass: "bg-success",
    iconClass: "text-success bg-success/10",
    featureKey: "ungated",
  },
  {
    id: "referrals",
    label: "Referrals",
    href: "/referrals",
    description: "Earn with affiliate links & payouts",
    dotClass: "bg-gold",
    iconClass: "text-gold bg-gold/10",
    featureKey: "ungated",
  },
  {
    id: "affiliate",
    label: "Affiliate",
    href: "/affiliate/dashboard",
    description: "Partner dashboard, hierarchy, and commissions",
    dotClass: "bg-accent-cyan",
    iconClass: "text-accent-cyan bg-accent-cyan/10",
    featureKey: "ungated",
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
    id: "voice",
    label: "Voice OS",
    href: "/voice",
    description: "AI calling campaigns, dialer & queue",
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
    id: "affiliate",
    label: "PartnerOS",
    href: "/affiliate/dashboard",
    description: "Referrals, hierarchy, commissions & payouts",
    dotClass: "bg-gold",
    iconClass: "text-gold bg-gold/10",
  },
];

/** Primary mobile bottom tabs — max 4 + More sheet (see MobileNav). */
export const MOBILE_NAV: CommandNavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, featureKey: "ungated" },
  { href: "/crm", label: "CRM", icon: Briefcase, featureKey: "crm" },
  { href: "/workforce", label: "AI", icon: Sparkles, featureKey: "aiWorkforce" },
  { href: "/voice", label: "Voice", icon: Phone, badgeKey: "voice", featureKey: "voiceAi" },
];

/** Extra destinations opened from the mobile More sheet. */
export const MOBILE_NAV_MORE: CommandNavItem[] = [
  { href: "/knowledge", label: "Knowledge", icon: Brain, featureKey: "ungated" },
  { href: "/referrals", label: "Referrals", icon: Handshake, featureKey: "ungated" },
  {
    href: "/affiliate/dashboard",
    label: "Affiliate",
    icon: Handshake,
    featureKey: "ungated",
  },
  { href: "/settings", label: "Settings", icon: Settings, featureKey: "ungated" },
  { href: "/billing", label: "Billing", icon: Wallet, featureKey: "ungated" },
];

export const SIDEBAR_BRAND = {
  title: "AARVANTA",
  subtitle: "BUSINESS OS",
  href: "/dashboard",
  icon: Globe2,
};
