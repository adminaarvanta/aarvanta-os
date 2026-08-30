"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Lock, LogOut, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { useDemoTourOptional } from "@/components/demo/demo-tour-provider";
import { PendingLink } from "@/components/layout/navigation-provider";
import { AllToolsPanel } from "@/components/layout/all-tools-panel";
import { useSidebarCollapse } from "@/components/layout/sidebar-collapse";
import {
  commandCenterNav,
  SIDEBAR_BRAND,
  SIDEBAR_SHORTCUTS,
} from "@/lib/navigation/command-center-nav";
import { cn } from "@/lib/utils";
import type { Organization, Workspace } from "@/types/tenant";
import { usePlan, isNavHrefLocked, isNavHrefVisible } from "@/components/billing/plan-context";
import { PremiumBadge } from "@/components/billing/plan-ui";

function isActive(pathname: string, href: string) {
  if (href === "#all-tools") return false;
  const path = href.split("?")[0];
  if (path === "/dashboard") return pathname.startsWith("/dashboard");
  if (path === "/crm") return pathname.startsWith("/crm");
  if (path === "/automation") {
    return (
      pathname.startsWith("/automation") ||
      pathname.startsWith("/workforce") ||
      pathname.startsWith("/workflows")
    );
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
  showWhatsAppNav = false,
  showOutreachNav = false,
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
  showWhatsAppNav?: boolean;
  showOutreachNav?: boolean;
}) {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(false);
  const { collapsed, setCollapsed, toggle } = useSidebarCollapse();
  const plan = usePlan();
  const tour = useDemoTourOptional();
  // Main tabs always visible — locked ones show a Pro badge.
  const navItems = commandCenterNav(showWhatsAppNav, showOutreachNav);
  const shortcuts = SIDEBAR_SHORTCUTS.filter((item) =>
    isNavHrefVisible(plan, item.href)
  );

  const tourActive = Boolean(tour?.active);
  const tourExpandSidebar = Boolean(tour?.step.expandSidebar);
  const tourOpenAllTools = Boolean(tour?.step.openAllTools);

  useEffect(() => {
    if (!tourActive) return;
    if (tourExpandSidebar && collapsed) {
      setCollapsed(false);
    }
    setToolsOpen(tourOpenAllTools);
  }, [
    collapsed,
    setCollapsed,
    tourActive,
    tourExpandSidebar,
    tourOpenAllTools,
  ]);

  useEffect(() => {
    if (tourActive) return;
    setToolsOpen(false);
  }, [tourActive]);

  return (
    <>
      <aside
        data-demo-tour="sidebar-rail"
        className={cn(
          "relative z-20 hidden h-full shrink-0 flex-col border-r border-border-subtle bg-surface transition-[width] duration-200 md:flex",
          // Keep overflow visible in the brand header so the mark never clips;
          // nav scrolls separately below.
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center overflow-visible border-b border-border-subtle",
            collapsed
              ? "flex-col justify-center gap-2 px-3 py-3"
              : "h-[120px] justify-center px-2 py-2"
          )}
        >
          <Link
            href={SIDEBAR_BRAND.href}
            className={cn(
              "flex shrink-0 items-center justify-center overflow-visible rounded-lg transition-colors hover:bg-surface-muted",
              collapsed ? "h-11 w-11" : "max-w-full"
            )}
            aria-label={SIDEBAR_BRAND.title}
          >
            <BrandLogo
              size={collapsed ? "rail" : "sidebar"}
              variant={collapsed ? "icon" : "full"}
              className={collapsed ? undefined : "max-h-[112px] max-w-full"}
            />
          </Link>
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-gold",
              collapsed ? "shrink-0" : "absolute right-2 top-3"
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

        <nav className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              const locked = isNavHrefLocked(plan, item.href);
              const badge =
                !locked && item.badgeKey === "whatsapp" && whatsappUnread > 0
                  ? whatsappUnread
                  : !locked && item.badgeKey === "voice" && voiceUnread > 0
                    ? voiceUnread
                    : null;
              const href = locked
                ? `/billing?upgrade=${item.href.replace(/^\//, "")}`
                : item.href;

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

              const isAutomation = item.href === "/automation";
              const showFreeBadge =
                isAutomation && plan?.planId === "free" && !locked;

              return (
                <li key={item.href}>
                  <PendingLink
                    href={href}
                    data-demo-tour={`nav-${tourNavId(item.href)}`}
                    pendingClassName="opacity-70"
                    title={locked ? `${item.label} — upgrade to unlock` : item.label}
                    className={cn(
                      "relative flex items-center rounded-lg text-sm font-medium transition-colors",
                      collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                      locked && "text-muted/80 hover:bg-gold/10 hover:text-foreground",
                      !locked &&
                        active &&
                        "bg-gold/15 text-gold-bright before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gold",
                      !locked &&
                        !active &&
                        "text-muted hover:bg-surface-hover hover:text-foreground"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed ? (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {locked ? (
                          <PremiumBadge />
                        ) : showFreeBadge ? (
                          <span className="rounded-md bg-accent-cyan/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-cyan">
                            Free
                          </span>
                        ) : badge !== null ? (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-semibold text-black">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        ) : null}
                      </>
                    ) : locked ? (
                      <span className="absolute right-1 top-1 text-gold">
                        <Lock className="h-3 w-3" aria-hidden />
                      </span>
                    ) : showFreeBadge ? (
                      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent-cyan" />
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
                {shortcuts.map((item) => (
                  <li key={item.id}>
                    <PendingLink
                      href={item.href}
                      data-demo-tour={`nav-${tourNavId(item.href)}`}
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

        <div className="shrink-0 border-t border-border-subtle p-3">
          {!collapsed ? (
            <div className="rounded-xl border border-border-subtle bg-surface-muted/70 p-2.5">
              <div className="flex items-center gap-2.5">
                <PendingLink
                  href="/settings"
                  data-demo-tour="nav-settings"
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-0.5 transition-colors hover:bg-surface-hover"
                  title="Account settings"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-gold ring-1 ring-gold/30">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight text-foreground">
                      {userName}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] leading-tight text-muted">
                      {userRole}
                      {plan ? (
                        <>
                          <span className="mx-1 text-dim">·</span>
                          <span className="text-gold-bright">
                            {plan.isSuperAdmin ? "Super Admin" : plan.planName}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </PendingLink>
                <PendingLink
                  href="/settings"
                  title="Settings"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-gold"
                >
                  <Settings className="h-4 w-4" />
                </PendingLink>
              </div>

              <div className="mt-2 flex items-center gap-1.5 border-t border-border-subtle pt-2">
                {plan ? (
                  <Link
                    href="/billing"
                    data-demo-tour="nav-billing"
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[11px] transition-colors hover:bg-surface-hover"
                  >
                    <span className="text-muted">Billing</span>
                    <span className="inline-flex items-center gap-0.5 font-semibold text-gold-bright">
                      Manage
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </Link>
                ) : (
                  <span className="flex-1" />
                )}
                {production ? (
                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      title="Sign out"
                      className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <PendingLink
                href="/settings"
                title={`${userName} — Settings`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-semibold text-gold ring-1 ring-gold/30 transition-opacity hover:opacity-90"
              >
                {userName.charAt(0).toUpperCase()}
              </PendingLink>
              <PendingLink
                href="/settings"
                title="Settings"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-gold"
              >
                <Settings className="h-4 w-4" />
              </PendingLink>
              {production ? (
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    title="Sign out"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </form>
              ) : null}
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
        includeWhatsApp={showWhatsAppNav}
        includeOutreach={showOutreachNav}
      />
    </>
  );
}
