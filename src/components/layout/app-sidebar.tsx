"use client";

import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Brain,
  Inbox,
  Kanban,
  LayoutDashboard,
  LayoutGrid,
  Plug,
  Settings,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { PendingLink } from "@/components/layout/navigation-provider";
import { WorkspaceSwitcher } from "@/components/tenant/workspace-switcher";
import { EXTENDED_NAV } from "@/lib/platform/modules";
import { cn } from "@/lib/utils";
import type { Organization, Workspace } from "@/types/tenant";

const coreNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Unified Inbox", icon: Inbox },
  { href: "/crm", label: "CRM", icon: LayoutDashboard },
  { href: "/workforce", label: "AI Workforce", icon: Sparkles },
  { href: "/knowledge", label: "Knowledge Hub", icon: Brain },
  { href: "/projects", label: "Projects", icon: Kanban },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/team", label: "Team", icon: Users },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/communications", label: "Communications", icon: Bell },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/platform", label: "All Modules", icon: LayoutGrid },
  { href: "/settings", label: "Settings", icon: Settings },
];

function tourNavId(href: string) {
  return href.replace(/^\//, "").replace(/\//g, "-") || "home";
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname.startsWith("/dashboard");
  if (href === "/crm") return pathname.startsWith("/crm");
  if (href === "/workforce") return pathname === "/workforce" || pathname.startsWith("/workforce/");
  if (href === "/knowledge") return pathname.startsWith("/knowledge") && !pathname.startsWith("/knowledge/graph");
  if (href === "/analytics") return pathname === "/analytics";
  if (href === "/platform") return pathname === "/platform";
  return pathname.startsWith(href);
}

export function AppSidebar({
  production,
  tenant,
}: {
  production: boolean;
  tenant?: {
    organization: Organization;
    workspace: Workspace;
    workspaces: Workspace[];
  } | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 shrink-0 min-h-0 flex-col overflow-hidden border-r border-[#3d3528] bg-[#0a0a0a]">
      <div className="border-b border-[#3d3528] px-4 py-5">
        <BrandLogo href="/dashboard" fullWidth />
      </div>
      {tenant && (
        <WorkspaceSwitcher
          organization={tenant.organization}
          workspace={tenant.workspace}
          workspaces={tenant.workspaces}
        />
      )}
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 space-y-4">
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-[#A89878]/60">
            Core
          </p>
          {coreNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <PendingLink
                key={item.href}
                href={item.href}
                data-demo-tour={`nav-${tourNavId(item.href)}`}
                pendingClassName="opacity-60"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#D4AF37]/15 text-[#F9E076] ring-1 ring-[#D4AF37]/30"
                    : "text-[#A89878] hover:bg-[#1a1714] hover:text-[#F5E6C8]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
              </PendingLink>
            );
          })}
        </div>
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-[#A89878]/60">
            Extended
          </p>
          {EXTENDED_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <PendingLink
                key={item.href}
                href={item.href}
                pendingClassName="opacity-60"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-[#D4AF37]/15 text-[#F9E076] ring-1 ring-[#D4AF37]/30"
                    : "text-[#A89878] hover:bg-[#1a1714] hover:text-[#F5E6C8]"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
              </PendingLink>
            );
          })}
        </div>
      </nav>
      <div className="border-t border-[#3d3528] p-4 text-[10px] text-[#A89878] space-y-2">
        <p>
          {production
            ? "Production · Firestore persistence"
            : "Demo mode · in-memory data"}
        </p>
        {production && (
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-[#D4AF37] hover:text-[#F9E076] hover:underline"
            >
              Sign out
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
