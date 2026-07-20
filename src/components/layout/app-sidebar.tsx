"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, Settings } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { PendingLink } from "@/components/layout/navigation-provider";
import { AllToolsPanel } from "@/components/layout/all-tools-panel";
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

  return (
    <>
      <aside className="relative z-20 hidden h-full w-[260px] shrink-0 flex-col border-r border-border-subtle bg-surface md:flex">
        <Link
          href={SIDEBAR_BRAND.href}
          className="flex h-[120px] shrink-0 items-center justify-center border-b border-border-subtle bg-transparent px-2 py-2 transition-colors hover:bg-surface-muted"
          aria-label={SIDEBAR_BRAND.title}
        >
          <BrandLogo size="sidebar" variant="full" />
        </Link>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
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
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span>{item.label}</span>
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
                    className={cn(
                      "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-gold/15 text-gold-bright before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gold"
                        : "text-muted hover:bg-surface-hover hover:text-foreground"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {badge !== null && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-semibold text-black">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </PendingLink>
                </li>
              );
            })}
          </ul>

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
        </nav>

        <div className="shrink-0 border-t border-border-subtle p-3">
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
        </div>
      </aside>

      <AllToolsPanel
        open={toolsOpen}
        onClose={() => setToolsOpen(false)}
        pathname={pathname}
        tenant={tenant}
      />
    </>
  );
}
