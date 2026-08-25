import {
  BarChart3,
  Briefcase,
  Brain,
  Globe2,
  Handshake,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  MessageCircle,
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
  { href: "/finance", label: "Finance", icon: Wallet, featureKey: "finance" },
  { href: "/analytics", label: "Insights", icon: BarChart3, featureKey: "analytics" },
  { href: "#all-tools", label: "More", icon: LayoutGrid, featureKey: "ungated" },
];

/**
 * Super-admin-only WhatsApp OS. Email-gated (not plan-gated) via
 * `canAccessWhatsAppOs` — currently `admin@aarvanta.co`.
 */
export const WHATSAPP_NAV_ITEM: CommandNavItem = {
  href: "/whatsapp",
  label: "WhatsApp",
  icon: MessageCircle,
  badgeKey: "whatsapp",
  featureKey: "ungated",
};

export const WHATSAPP_OS_ITEM: OperatingSystemItem = {
  id: "whatsapp",
  label: "WhatsApp OS",
  href: "/whatsapp",
  description: "Business inbox, templates & profile",
  dotClass: "bg-success",
  iconClass: "text-success bg-success/10",
};

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
    id: "team",
    label: "Team",
    href: "/team",
    description: "People, roles, and collaboration",
    dotClass: "bg-success",
    iconClass: "text-success bg-success/10",
    featureKey: "ungated",
  },
  {
    id: "partners",
    label: "Partners",
    href: "/partners",
    description: "Share links, commissions, and payouts",
    dotClass: "bg-gold",
    iconClass: "text-gold bg-gold/10",
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
    href: "/partners",
    description: "Share links, commissions & payouts",
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
  { href: "/hr", label: "People", icon: Landmark, featureKey: "hr" },
  { href: "/finance", label: "Finance", icon: Wallet, featureKey: "finance" },
  { href: "/knowledge", label: "Knowledge", icon: Brain, featureKey: "ungated" },
  { href: "/partners", label: "Partners", icon: Handshake, featureKey: "ungated" },
  { href: "/settings", label: "Settings", icon: Settings, featureKey: "ungated" },
  { href: "/billing", label: "Billing", icon: Wallet, featureKey: "ungated" },
];

export const SIDEBAR_BRAND = {
  title: "AARVANTA",
  subtitle: "BUSINESS OS",
  href: "/dashboard",
  icon: Globe2,
};

function insertAfterHref<T extends { href: string }>(
  items: T[],
  afterHref: string,
  extra: T
): T[] {
  const idx = items.findIndex((item) => item.href === afterHref);
  const at = idx === -1 ? 1 : idx + 1;
  return [...items.slice(0, at), extra, ...items.slice(at)];
}

export function commandCenterNav(showWhatsApp: boolean): CommandNavItem[] {
  if (!showWhatsApp) return COMMAND_CENTER_NAV;
  return insertAfterHref(COMMAND_CENTER_NAV, "/voice", WHATSAPP_NAV_ITEM);
}

export function mobileMoreNav(showWhatsApp: boolean): CommandNavItem[] {
  if (!showWhatsApp) return MOBILE_NAV_MORE;
  return [WHATSAPP_NAV_ITEM, ...MOBILE_NAV_MORE];
}

export function operatingSystems(showWhatsApp: boolean): OperatingSystemItem[] {
  if (!showWhatsApp) return OPERATING_SYSTEMS;
  const idx = OPERATING_SYSTEMS.findIndex((item) => item.id === "voice");
  const at = idx === -1 ? 0 : idx + 1;
  return [
    ...OPERATING_SYSTEMS.slice(0, at),
    WHATSAPP_OS_ITEM,
    ...OPERATING_SYSTEMS.slice(at),
  ];
}
