"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, LogOut, Search, Settings, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { BrandLogo } from "@/components/brand/logo";
import { useDemoTourOptional } from "@/components/demo/demo-tour-provider";
import { WorkspaceSwitcher } from "@/components/tenant/workspace-switcher";
import {
  filterTools,
  getAllToolsModules,
  getFrequentTools,
  groupToolsByCategory,
  TOOL_GROUP_LABELS,
  TOOL_GROUP_ORDER,
} from "@/lib/navigation/all-tools";
import { SIDEBAR_RAIL_NAV, SIDEBAR_WEBSITE_CHAT } from "@/lib/navigation/sidebar-nav";
import { cn } from "@/lib/utils";
import type { Organization, Workspace } from "@/types/tenant";

const SIDEBAR_COLLAPSED = 56;
const SIDEBAR_EXPANDED = 208;
const SIDEBAR_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const SIDEBAR_MS = 220;
const COLLAPSE_DELAY_MS = 150;

/** Label that fades/slides in without shifting the icon column. */
function SidebarLabel({
  expanded,
  children,
  className,
}: {
  expanded: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block min-w-0 truncate whitespace-nowrap text-sm font-medium",
        "transition-[max-width,opacity,margin] ease-out",
        expanded ? "ml-2 max-w-[132px] opacity-100" : "ml-0 max-w-0 opacity-0",
        className
      )}
      style={{ transitionDuration: `${SIDEBAR_MS}ms`, transitionTimingFunction: SIDEBAR_EASE }}
      aria-hidden={!expanded}
    >
      {children}
    </span>
  );
}

function SidebarIconSlot({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center">{children}</span>
  );
}

function SidebarBrandLabel({ expanded }: { expanded: boolean }) {
  if (!expanded) return null;
  return (
    <div className="ml-2 min-w-0 flex-1 overflow-hidden">
      <BrandLogo size="sm" className="max-h-10" />
    </div>
  );
}

function tourNavId(href: string) {
  return href.replace(/^\//, "").replace(/\//g, "-") || "home";
}

function isActive(pathname: string, href: string) {
  const path = href.split("?")[0];
  if (path === "/dashboard") return pathname.startsWith("/dashboard");
  if (path === "/crm") return pathname.startsWith("/crm");
  if (path === "/workforce") {
    return pathname === "/workforce" || pathname.startsWith("/workforce/");
  }
  if (path === "/knowledge") {
    return pathname.startsWith("/knowledge") && !pathname.startsWith("/knowledge/graph");
  }
  if (path === "/platform") return pathname.startsWith("/platform");
  if (path === "/hr") return pathname.startsWith("/hr");
  return pathname.startsWith(path);
}

function ToolLink({
  module,
  pathname,
  variant = "list",
  onNavigate,
}: {
  module: { href: string; label: string; icon: LucideIcon };
  pathname: string;
  variant?: "list" | "tile";
  onNavigate?: () => void;
}) {
  const Icon = module.icon;
  const active = isActive(pathname, module.href);

  if (variant === "tile") {
    return (
      <PendingLink
        href={module.href}
        onClick={onNavigate}
        pendingClassName="opacity-60"
        className={cn(
          "flex min-w-[88px] flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-center transition-colors",
          active
            ? "bg-gold/15 text-gold-bright ring-1 ring-gold/25"
            : "text-muted hover:bg-surface-hover hover:text-foreground"
        )}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-muted ring-1 ring-border-subtle">
          <Icon className="h-4 w-4" />
        </span>
        <span className="line-clamp-2 text-[10px] font-medium leading-tight">
          {module.label}
        </span>
      </PendingLink>
    );
  }

  return (
    <PendingLink
      href={module.href}
      onClick={onNavigate}
      pendingClassName="opacity-60"
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-gold/10 text-gold-bright"
          : "text-muted hover:bg-surface-hover hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{module.label}</span>
    </PendingLink>
  );
}

function ToolsPanel({
  open,
  onClose,
  pathname,
  tenant,
  sidebarWidth,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  tenant?: {
    organization: Organization;
    workspace: Workspace;
    workspaces: Workspace[];
  } | null;
  sidebarWidth: number;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const allModules = useMemo(() => getAllToolsModules(), []);
  const filtered = useMemo(
    () => filterTools(allModules, query),
    [allModules, query]
  );
  const frequent = useMemo(() => getFrequentTools(allModules), [allModules]);
  const grouped = useMemo(() => groupToolsByCategory(filtered), [filtered]);

  useEffect(() => {
    if (open) {
      setQuery("");
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      data-demo-tour="all-tools-panel"
      className="fixed top-0 z-50 flex h-full w-[min(720px,calc(100vw-3.5rem))] flex-col bg-surface-elevated shadow-[8px_0_48px_rgba(0,0,0,0.45)]"
      style={{
        left: sidebarWidth,
        transition: `left ${SIDEBAR_MS}ms ${SIDEBAR_EASE}`,
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 shadow-[0_8px_16px_-12px_rgba(0,0,0,0.5)]">
        <h2 className="text-sm font-semibold text-foreground">All tools</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
          aria-label="Close tools menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {tenant && (
        <div className="px-3 py-2">
          <WorkspaceSwitcher
            organization={tenant.organization}
            workspace={tenant.workspace}
            workspaces={tenant.workspaces}
          />
        </div>
      )}

      <div className="px-4 py-3 shadow-[0_8px_16px_-12px_rgba(0,0,0,0.45)]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all tools…"
            className="w-full rounded-lg bg-surface-muted py-2 pl-9 pr-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_2px_8px_rgba(0,0,0,0.2)] placeholder:text-dim focus:outline-none focus:shadow-[inset_0_1px_0_rgba(184, 150, 93,0.08),0_0_0_1px_rgba(184, 150, 93,0.2),0_2px_8px_rgba(0,0,0,0.25)]"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        {!query && (
          <section className="mb-5">
            <h3 className="mb-2 text-xs font-semibold text-foreground">
              Frequently used
            </h3>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {frequent.map((module) => (
                <ToolLink
                  key={module.id}
                  module={module}
                  pathname={pathname}
                  variant="tile"
                  onNavigate={onClose}
                />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No tools match your search.</p>
        ) : (
          <div className="space-y-6">
            {TOOL_GROUP_ORDER.map((group) => {
              const items = grouped[group];
              if (!items?.length) return null;
              return (
                <section key={group}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    {TOOL_GROUP_LABELS[group] ?? group}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-3">
                    {items.map((module) => (
                      <ToolLink
                        key={module.id}
                        module={module}
                        pathname={pathname}
                        onNavigate={onClose}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 py-3 shadow-[0_-8px_16px_-12px_rgba(0,0,0,0.45)] space-y-2">
        <a
          href="/chat"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="block text-xs font-medium text-gold hover:text-gold-bright"
        >
          Open visitor chat →
        </a>
        <Link
          href="/platform"
          onClick={onClose}
          className="block text-xs font-medium text-gold hover:text-gold-bright"
        >
          View full module directory →
        </Link>
      </div>
    </div>
  );
}

function SidebarFooterLink({
  item,
  expanded,
  onNavigate,
}: {
  item: { href: string; label: string; icon: LucideIcon };
  expanded: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      data-demo-tour={`nav-${tourNavId(item.href)}`}
      title={item.label}
      className={cn(
        "relative flex h-10 w-full items-center rounded-lg transition-colors duration-150",
        expanded ? "px-1" : "justify-center",
        "text-muted hover:bg-surface-hover hover:text-foreground"
      )}
    >
      <SidebarIconSlot>
        <Icon className="h-[18px] w-[18px]" />
      </SidebarIconSlot>
      <SidebarLabel expanded={expanded}>{item.label}</SidebarLabel>
    </a>
  );
}

function SignOutNavItem({ expanded }: { expanded: boolean }) {
  return (
    <form action="/api/auth/logout" method="post" className="w-full">
      <button
        type="submit"
        title="Sign out"
        className={cn(
          "relative flex h-10 w-full items-center rounded-lg transition-colors duration-150",
          expanded ? "px-1" : "justify-center",
          "text-muted hover:bg-surface-hover hover:text-foreground"
        )}
      >
        <SidebarIconSlot>
          <LogOut className="h-[18px] w-[18px]" />
        </SidebarIconSlot>
        <SidebarLabel expanded={expanded}>Sign out</SidebarLabel>
      </button>
    </form>
  );
}

function NavItem({
  item,
  pathname,
  expanded,
  onNavigate,
}: {
  item: { href: string; label: string; icon: LucideIcon };
  pathname: string;
  expanded: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const active = isActive(pathname, item.href);

  return (
    <PendingLink
      href={item.href}
      onClick={onNavigate}
      data-demo-tour={`nav-${tourNavId(item.href)}`}
      pendingClassName="opacity-60"
      className={cn(
        "relative flex h-10 w-full items-center rounded-lg transition-colors duration-150",
        expanded ? "px-1" : "justify-center",
        active
          ? "bg-gold/10 text-gold-bright before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-gold"
          : "text-muted hover:bg-surface-hover hover:text-foreground"
      )}
    >
      <SidebarIconSlot>
        <Icon className="h-[18px] w-[18px]" />
      </SidebarIconSlot>
      <SidebarLabel expanded={expanded}>{item.label}</SidebarLabel>
    </PendingLink>
  );
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
  const tour = useDemoTourOptional();
  const [expanded, setExpanded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tourExpandSidebar = Boolean(tour?.active && tour.step.expandSidebar);
  const tourOpenAllTools = Boolean(tour?.active && tour.step.openAllTools);

  const sidebarExpanded = expanded || panelOpen || tourExpandSidebar;
  const sidebarWidth = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;
  const toolsPanelOpen = panelOpen || tourOpenAllTools;

  const clearCollapseTimer = () => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearCollapseTimer();
    setExpanded(true);
  };

  const handleMouseLeave = () => {
    if (panelOpen || tour?.active) return;
    clearCollapseTimer();
    collapseTimer.current = setTimeout(() => setExpanded(false), COLLAPSE_DELAY_MS);
  };

  useEffect(() => () => clearCollapseTimer(), []);

  const closeToolsPanel = () => setPanelOpen(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && panelOpen) setPanelOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panelOpen]);

  return (
    <>
      <div className="relative hidden md:flex shrink-0 z-20">
        <aside
          data-demo-tour="sidebar-rail"
          className={cn(
            "flex min-h-0 shrink-0 flex-col overflow-hidden bg-surface shadow-[4px_0_32px_rgba(0,0,0,0.4)]",
            sidebarExpanded ? "w-52" : "w-14"
          )}
          style={{
            transition: `width ${SIDEBAR_MS}ms ${SIDEBAR_EASE}`,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex h-14 shrink-0 items-center p-2">
            <Link
              href="/dashboard"
              onClick={closeToolsPanel}
              title="Aarvanta Business OS"
              className={cn(
                "flex h-10 w-full min-w-0 items-center rounded-lg transition-colors hover:bg-surface-hover/60",
                sidebarExpanded ? "px-1" : "justify-center"
              )}
            >
              <SidebarIconSlot>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A2B48] text-sm font-bold tracking-tight text-[#B8965D] ring-1 ring-[#B8965D]/35">
                  A
                </span>
              </SidebarIconSlot>
              <SidebarBrandLabel expanded={sidebarExpanded} />
            </Link>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            <div className="space-y-0.5">
              {SIDEBAR_RAIL_NAV.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  expanded={sidebarExpanded}
                  onNavigate={closeToolsPanel}
                />
              ))}
            </div>

            <div className="mt-3 pt-1">
              <button
                type="button"
                data-demo-tour="nav-all-tools"
                onClick={() => setPanelOpen((open) => !open)}
                className={cn(
                  "relative flex h-10 w-full items-center rounded-lg transition-colors duration-150",
                  sidebarExpanded ? "px-1" : "justify-center",
                  panelOpen || tourOpenAllTools
                    ? "bg-gold/15 text-gold-bright ring-1 ring-gold/25"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                )}
                aria-label="All tools"
                aria-expanded={panelOpen || tourOpenAllTools}
              >
                <SidebarIconSlot>
                  <LayoutGrid className="h-[18px] w-[18px]" />
                </SidebarIconSlot>
                <SidebarLabel expanded={sidebarExpanded}>All tools</SidebarLabel>
              </button>
            </div>
          </nav>

          <div className="mt-auto shrink-0 space-y-0.5 p-2">
            <SidebarFooterLink
              item={SIDEBAR_WEBSITE_CHAT}
              expanded={sidebarExpanded}
              onNavigate={closeToolsPanel}
            />
            <PendingLink
              href="/settings"
              data-demo-tour="nav-settings"
              onClick={closeToolsPanel}
              className={cn(
                "relative flex h-10 w-full items-center rounded-lg transition-colors duration-150",
                sidebarExpanded ? "px-1" : "justify-center",
                pathname.startsWith("/settings")
                  ? "bg-gold/10 text-gold-bright before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-gold"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <SidebarIconSlot>
                <Settings className="h-[18px] w-[18px]" />
              </SidebarIconSlot>
              <SidebarLabel expanded={sidebarExpanded}>Settings</SidebarLabel>
            </PendingLink>
            {production && <SignOutNavItem expanded={sidebarExpanded} />}
          </div>
        </aside>

        <ToolsPanel
          open={toolsPanelOpen}
          onClose={() => {
            if (tourOpenAllTools) return;
            setPanelOpen(false);
          }}
          pathname={pathname}
          tenant={tenant}
          sidebarWidth={sidebarWidth}
        />
      </div>
    </>
  );
}
