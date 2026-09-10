import {
  BarChart3,
  Briefcase,
  Brain,
  Building2,
  Globe2,
  Hammer,
  Handshake,
  Inbox,
  Kanban,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  MessageCircle,
  Phone,
  Plug,
  Settings,
  Sparkles,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { maturityForHref } from "@/lib/product/maturity";
import type { MaturityStatus } from "@/lib/product/maturity";

export type CommandNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "whatsapp" | "voice";
  maturity?: MaturityStatus;
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
  dotClass: string;
  iconClass: string;
  description?: string;
  featureKey?: CommandNavItem["featureKey"];
};

function withMaturity(item: CommandNavItem): CommandNavItem {
  return {
    ...item,
    maturity: item.maturity ?? maturityForHref(item.href)?.status,
  };
}

/** Primary sidebar — Business OS information architecture. */
export const COMMAND_CENTER_NAV: CommandNavItem[] = (
  [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard, featureKey: "ungated" },
    { href: "/crm", label: "Customers", icon: Building2, featureKey: "crm" },
    { href: "/projects", label: "Work", icon: Kanban, featureKey: "projects" },
    { href: "/inbox", label: "Inbox", icon: Inbox, featureKey: "ungated" },
    {
      href: "/automation?view=ask",
      label: "AI",
      icon: Sparkles,
      featureKey: "aiWorkforce",
    },
    { href: "/knowledge", label: "Knowledge", icon: Brain, featureKey: "ungated" },
    { href: "/workflows", label: "Automations", icon: Workflow, featureKey: "workflows" },
    { href: "/finance", label: "Finance", icon: Wallet, featureKey: "finance" },
    { href: "/hr", label: "People", icon: Landmark, featureKey: "hr" },
    { href: "/build", label: "Website", icon: Hammer, featureKey: "ungated" },
    { href: "/analytics", label: "Analytics", icon: BarChart3, featureKey: "analytics" },
    { href: "#all-tools", label: "More", icon: LayoutGrid, featureKey: "ungated" },
  ] satisfies CommandNavItem[]
).map(withMaturity);

export const WHATSAPP_NAV_ITEM: CommandNavItem = withMaturity({
  href: "/whatsapp",
  label: "WhatsApp",
  icon: MessageCircle,
  badgeKey: "whatsapp",
  featureKey: "ungated",
});

export const WHATSAPP_OS_ITEM: OperatingSystemItem = {
  id: "whatsapp",
  label: "WhatsApp",
  href: "/whatsapp",
  description: "Business inbox, templates & profile",
  dotClass: "bg-success",
  iconClass: "text-success bg-success/10",
};

export const OUTREACH_NAV_ITEM: CommandNavItem = withMaturity({
  href: "/outreach",
  label: "Email",
  icon: Mail,
  featureKey: "ungated",
});

export const EMAIL_OS_ITEM: OperatingSystemItem = {
  id: "outreach",
  label: "Email outreach",
  href: "/outreach",
  description: "Gated campaigns — not a Marketing OS",
  dotClass: "bg-accent-cyan",
  iconClass: "text-accent-cyan bg-accent-cyan/10",
};

export const SIDEBAR_SHORTCUTS: OperatingSystemItem[] = [
  {
    id: "voice",
    label: "Voice",
    href: "/voice",
    description: "Calls, dialer, and campaigns",
    dotClass: "bg-primary-bright",
    iconClass: "text-primary-bright bg-primary-soft",
    featureKey: "voiceAi",
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
    id: "integrations",
    label: "Integrations",
    href: "/integrations",
    description: "Connect calendar, email, and channels",
    dotClass: "bg-accent-cyan",
    iconClass: "text-accent-cyan bg-accent-cyan/10",
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

export const OPERATING_SYSTEMS: OperatingSystemItem[] = [
  {
    id: "customers",
    label: "Customers",
    href: "/crm",
    description: "Customer 360, leads, and deals",
    dotClass: "bg-accent-cyan",
    iconClass: "text-accent-cyan bg-accent-cyan/10",
  },
  {
    id: "inbox",
    label: "Inbox",
    href: "/inbox",
    description: "Relationship conversations",
    dotClass: "bg-gold",
    iconClass: "text-gold bg-gold/10",
  },
  {
    id: "ai",
    label: "AI Workforce",
    href: "/automation?view=ask",
    description: "Ask Aarvanta and specialist agents",
    dotClass: "bg-primary-bright",
    iconClass: "text-primary-bright bg-primary-soft",
  },
  {
    id: "work",
    label: "Work",
    href: "/projects",
    description: "Projects and tasks",
    dotClass: "bg-gold-dark",
    iconClass: "text-gold-dark bg-gold/10",
  },
];

export const MOBILE_NAV: CommandNavItem[] = (
  [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard, featureKey: "ungated" },
    { href: "/crm", label: "Customers", icon: Building2, featureKey: "crm" },
    { href: "/inbox", label: "Inbox", icon: Inbox, featureKey: "ungated" },
    {
      href: "/automation?view=ask",
      label: "AI",
      icon: Sparkles,
      featureKey: "aiWorkforce",
    },
  ] satisfies CommandNavItem[]
).map(withMaturity);

export const MOBILE_NAV_MORE: CommandNavItem[] = (
  [
    { href: "/projects", label: "Work", icon: Kanban, featureKey: "projects" },
    { href: "/knowledge", label: "Knowledge", icon: Brain, featureKey: "ungated" },
    { href: "/workflows", label: "Automations", icon: Workflow, featureKey: "workflows" },
    { href: "/voice", label: "Voice", icon: Phone, badgeKey: "voice", featureKey: "voiceAi" },
    { href: "/hr", label: "People", icon: Landmark, featureKey: "hr" },
    { href: "/finance", label: "Finance", icon: Wallet, featureKey: "finance" },
    { href: "/build", label: "Website", icon: Hammer, featureKey: "ungated" },
    { href: "/analytics", label: "Analytics", icon: BarChart3, featureKey: "analytics" },
    { href: "/team", label: "Team", icon: Users, featureKey: "ungated" },
    { href: "/integrations", label: "Integrations", icon: Plug, featureKey: "ungated" },
    { href: "/partners", label: "Partners", icon: Handshake, featureKey: "ungated" },
    { href: "/settings", label: "Settings", icon: Settings, featureKey: "ungated" },
    { href: "/billing", label: "Billing", icon: Wallet, featureKey: "ungated" },
  ] satisfies CommandNavItem[]
).map(withMaturity);

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

export function commandCenterNav(
  showWhatsApp: boolean,
  showOutreach = false
): CommandNavItem[] {
  let nav = COMMAND_CENTER_NAV;
  if (showWhatsApp) {
    nav = insertAfterHref(nav, "/inbox", WHATSAPP_NAV_ITEM);
  }
  if (showOutreach) {
    nav = insertAfterHref(nav, "/inbox", OUTREACH_NAV_ITEM);
  }
  return nav;
}

export function mobileMoreNav(
  showWhatsApp: boolean,
  showOutreach = false
): CommandNavItem[] {
  const extras: CommandNavItem[] = [];
  if (showWhatsApp) extras.push(WHATSAPP_NAV_ITEM);
  if (showOutreach) extras.push(OUTREACH_NAV_ITEM);
  return extras.length ? [...extras, ...MOBILE_NAV_MORE] : MOBILE_NAV_MORE;
}

export function operatingSystems(
  showWhatsApp: boolean,
  showOutreach = false
): OperatingSystemItem[] {
  let systems = OPERATING_SYSTEMS;
  if (showWhatsApp) {
    systems = [...systems, WHATSAPP_OS_ITEM];
  }
  if (showOutreach) {
    systems = [...systems, EMAIL_OS_ITEM];
  }
  return systems;
}

export function navPath(href: string) {
  return href.split("?")[0];
}

export function isCommandNavActive(pathname: string, href: string) {
  if (href === "#all-tools") return false;
  const path = navPath(href);
  if (path === "/dashboard") return pathname.startsWith("/dashboard");
  if (path === "/crm") return pathname.startsWith("/crm") || pathname.startsWith("/customers");
  if (path === "/inbox") {
    return (
      pathname.startsWith("/inbox") ||
      pathname.startsWith("/voice") ||
      pathname.startsWith("/whatsapp") ||
      pathname.startsWith("/communications")
    );
  }
  if (path === "/automation") {
    return pathname.startsWith("/automation") || pathname.startsWith("/workforce");
  }
  if (path === "/workflows") return pathname.startsWith("/workflows");
  if (path === "/projects") return pathname.startsWith("/projects");
  return pathname.startsWith(path);
}
