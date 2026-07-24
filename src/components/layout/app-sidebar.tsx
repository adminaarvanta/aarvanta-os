"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { PendingLink } from "@/components/layout/navigation-provider";
import { AllToolsPanel } from "@/components/layout/all-tools-panel";
import { useSidebarCollapse } from "@/components/layout/sidebar-collapse";
import {
  COMMAND_CENTER_NAV,
  SIDEBAR_BRAND,
  SIDEBAR_SHORTCUTS,
} from "@/lib/navigation/command-center-nav";
import { cn } from "@/lib/utils";
import type { Organization, Workspace } from "@/types/tenant";

function isActive(pathname: string, href: string) {
  if (href === "#all-tools") return false;
  const path = href.split("?")[0];
  if (path === "/dashboard") return pathname.startsWith("/dashboard");
  if (path === "/crm") return pathname.startsWith("/crm");
  if (path === "/workforce") {
    return pathname === "/workforce" || pathname.startsWith("/workforce/");
  }
  if (path === "/analytics") return pathname.startsWith("/analytics");
  return pathname.startsWith(path);
}

function tourNavId(href: string) {
  return href.replace(/^\//, "").replace(/\//g, "-") || "home";
}

export function AppSidebar({
  production,
  tenant,
  userName = "Founder",
  userRole = "Owner",
  whatsappUnread = 0,
  voiceUnread = 0,
}: {
  production: boolean;
  tenant?: {
    organization: Organization;
    workspace: Workspace;
    workspaces: Workspace[];
  } | null;
  userName?: string;
  userRole?: string;
  whatsappUnread?: number;
  voiceUnread?: number;
}) {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(false);
  const { collapsed, toggle } = useSidebarCollapse();

  return (
    <>
      <aside
        className={cn(
          "relative z-20 hidden h-full shrink-0 flex-col border-r border-border-subtle bg-surface transition-[width] duration-200 md:flex",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center border-b border-border-subtle",
            collapsed ? "h-16 flex-col justify-center gap-1 px-1 py-2" : "h-[120px] justify-center px-2 py-2"
          )}
        >
          <Link
            href={SIDEBAR_BRAND.href}
            className="flex items-center justify-center rounded-lg transition-colors hover:bg-surface-muted"
            aria-label={SIDEBAR_BRAND.title}
          >
            <BrandLogo size={collapsed ? "sm" : "sidebar"} variant={collapsed ? "icon" : "full"} />
          </Link>
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-gold",
              collapsed ? "" : "absolute right-2 top-3"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {COMMAND_CENTER_NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              const badge =
                item.badgeKey === "whatsapp" && whatsappUnread > 0
                  ? whatsappUnread
                  : item.badgeKey === "voice" && voiceUnread > 0
                    ? voiceUnread
                    : null;

              if (item.href === "#all-tools") {
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => setToolsOpen(true)}
                      title={item.label}
                      className={cn(
                        "flex w-full items-center rounded-lg text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground",
                        collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed ? <span>{item.label}</span> : null}
                    </button>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <PendingLink
                    href={item.href}
                    data-demo-tour={`nav-${tourNavId(item.href)}`}
                    pendingClassName="opacity-70"
                    title={item.label}
                    className={cn(
                      "relative flex items-center rounded-lg text-sm font-medium transition-colors",
                      collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                      active
                        ? "bg-gold/15 text-gold-bright before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gold"
                        : "text-muted hover:bg-surface-hover hover:text-foreground"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed ? (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {badge !== null && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-semibold text-black">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                      </>
                    ) : badge !== null ? (
                      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-gold" />
                    ) : null}
                  </PendingLink>
                </li>
              );
            })}
          </ul>

          {!collapsed ? (
            <div className="mt-6">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
                Shortcuts
              </p>
              <ul className="space-y-0.5">
                {SIDEBAR_SHORTCUTS.map((item) => (
                  <li key={item.id}>
                    <PendingLink
                      href={item.href}
                      pendingClassName="opacity-70"
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground",
                        isActive(pathname, item.href) && "bg-surface-muted text-foreground"
                      )}
                    >
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", item.dotClass)} />
                      <span className="truncate">{item.label}</span>
                    </PendingLink>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </nav>

        <div className="shrink-0 border-t border-border-subtle p-2">
          {!collapsed ? (
            <>
              <div className="mb-2 flex items-center justify-center px-2 text-muted">
                <PendingLink
                  href="/settings"
                  className="rounded-lg p-2 hover:bg-surface-hover hover:text-gold"
                >
                  <Settings className="h-4 w-4" />
                </PendingLink>
              </div>
              <PendingLink
                href="/settings"
                className="flex items-center gap-3 rounded-xl bg-surface-muted px-3 py-2.5 transition-colors hover:bg-surface-hover"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-gold ring-1 ring-gold/30">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
                  <p className="truncate text-xs text-muted">{userRole}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-dim" />
              </PendingLink>
              {production && (
                <form action="/api/auth/logout" method="post" className="mt-2">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <PendingLink
                href="/settings"
                title="Settings"
                className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-gold"
              >
                <Settings className="h-4 w-4" />
              </PendingLink>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-semibold text-gold ring-1 ring-gold/30">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </aside>

      <AllToolsPanel
        open={toolsOpen}
        onClose={() => setToolsOpen(false)}
        pathname={pathname}
        tenant={tenant}
        sidebarCollapsed={collapsed}
      />
    </>
  );
}
