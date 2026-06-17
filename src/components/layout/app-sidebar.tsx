"use client";

import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Brain,
  Inbox,
  Kanban,
  LayoutDashboard,
  Plug,
  Settings,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { PendingLink } from "@/components/layout/navigation-provider";
import { WorkspaceSwitcher } from "@/components/tenant/workspace-switcher";
import { cn } from "@/lib/utils";
import type { Organization, Workspace } from "@/types/tenant";

const nav = [
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
  { href: "/settings", label: "Settings", icon: Settings },
];

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
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-[#3d3528] bg-[#0a0a0a]">
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
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/dashboard"
              ? pathname.startsWith("/dashboard")
              : item.href === "/crm"
                ? pathname.startsWith("/crm")
                : item.href === "/workforce"
                  ? pathname.startsWith("/workforce")
                  : item.href === "/knowledge"
                    ? pathname.startsWith("/knowledge")
                    : item.href === "/projects"
                      ? pathname.startsWith("/projects")
                      : item.href === "/workflows"
                        ? pathname.startsWith("/workflows")
                        : item.href === "/team"
                          ? pathname.startsWith("/team")
                          : item.href === "/integrations"
                            ? pathname.startsWith("/integrations")
                            : item.href === "/communications"
                              ? pathname.startsWith("/communications")
                              : item.href === "/analytics"
                                ? pathname.startsWith("/analytics")
                                : item.href === "/settings"
                                  ? pathname.startsWith("/settings")
                                  : pathname.startsWith(item.href);
          const content = (
            <>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
            </>
          );
          return (
            <PendingLink
              key={item.href}
              href={item.href}
              pendingClassName="opacity-60"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#D4AF37]/15 text-[#F9E076] ring-1 ring-[#D4AF37]/30"
                  : "text-[#A89878] hover:bg-[#1a1714] hover:text-[#F5E6C8]"
              )}
            >
              {content}
            </PendingLink>
          );
        })}
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
