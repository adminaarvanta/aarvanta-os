import {
  Briefcase,
  Inbox,
  Kanban,
  Landmark,
  LayoutDashboard,
  Sparkles,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Icon rail — quick access; full catalog lives in the All tools flyout. */
export const SIDEBAR_RAIL_NAV: SidebarNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/crm", label: "CRM", icon: Briefcase },
  { href: "/workforce", label: "AI Workforce", icon: Sparkles },
  { href: "/projects", label: "Projects", icon: Kanban },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/hr", label: "HR", icon: Landmark },
];

/** @deprecated Use SIDEBAR_RAIL_NAV + All tools flyout */
export const SIDEBAR_MAIN_NAV = SIDEBAR_RAIL_NAV;

/** @deprecated Settings is on the rail footer; modules are in All tools */
export const SIDEBAR_SECONDARY_NAV: SidebarNavItem[] = [];
