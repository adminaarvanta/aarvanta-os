"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { WorkspaceSwitcher } from "@/components/tenant/workspace-switcher";
import { PremiumBadge } from "@/components/billing/plan-ui";
import { isModuleLocked, usePlan } from "@/components/billing/plan-context";
import {
  filterTools,
  getAllToolsModules,
  getFrequentTools,
  groupToolsByCategory,
  TOOL_GROUP_LABELS,
  TOOL_GROUP_ORDER,
} from "@/lib/navigation/all-tools";
import { cn } from "@/lib/utils";
import type { Organization, Workspace } from "@/types/tenant";

function isActive(pathname: string, href: string) {
  const path = href.split("?")[0];
  if (path === "/dashboard") return pathname.startsWith("/dashboard");
  if (path === "/crm") return pathname.startsWith("/crm");
  return pathname.startsWith(path);
}

function ToolLink({
  module,
  pathname,
  onNavigate,
  locked,
}: {
  module: { id: string; href: string; label: string; icon: LucideIcon };
  pathname: string;
  onNavigate?: () => void;
  locked?: boolean;
}) {
  const Icon = module.icon;
  const active = isActive(pathname, module.href);
  const href = locked ? `/billing?upgrade=${module.id}` : module.href;

  return (
    <PendingLink
      href={href}
      onClick={onNavigate}
      pendingClassName="opacity-60"
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
        locked
          ? "text-muted/80 hover:bg-gold/10 hover:text-foreground"
          : active
            ? "bg-primary-soft text-primary"
            : "text-muted hover:bg-surface-hover hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{module.label}</span>
      {locked ? <PremiumBadge /> : null}
    </PendingLink>
  );
}

export function AllToolsPanel({
  open,
  onClose,
  pathname,
  tenant,
  sidebarCollapsed = false,
  includeWhatsApp = false,
  includeOutreach = false,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  tenant?: {
    organization: Organization;
    workspace: Workspace;
    workspaces: Workspace[];
  } | null;
  sidebarCollapsed?: boolean;
  includeWhatsApp?: boolean;
  includeOutreach?: boolean;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const plan = usePlan();
  const allModules = useMemo(
    () => getAllToolsModules({ includeWhatsApp, includeOutreach }),
    [includeWhatsApp, includeOutreach]
  );
  const filtered = useMemo(() => filterTools(allModules, query), [allModules, query]);
  const frequent = useMemo(() => getFrequentTools(allModules), [allModules]);
  const grouped = useMemo(() => groupToolsByCategory(filtered), [filtered]);

  useEffect(() => {
    if (open) {
      setQuery("");
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close all tools"
        className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        data-demo-tour="all-tools-panel"
        className={`fixed top-0 z-50 flex h-full flex-col border-r border-border bg-surface shadow-xl ${
          sidebarCollapsed
            ? "left-[72px] w-[min(720px,calc(100vw-72px))]"
            : "left-[260px] w-[min(720px,calc(100vw-260px))]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">All tools</h2>
            {plan ? (
              <p className="text-[11px] text-muted">
                On {plan.planName} — locked tools show a Pro badge
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {tenant ? (
          <div className="border-b border-border-subtle px-4 py-2">
            <WorkspaceSwitcher
              organization={tenant.organization}
              workspace={tenant.workspace}
              workspaces={tenant.workspaces}
            />
          </div>
        ) : null}

        <div className="border-b border-border-subtle px-4 py-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5">
            <Search className="h-4 w-4 text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools…"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {!query ? (
            <div className="mb-6">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-dim">
                Frequent
              </p>
              <div className="grid gap-0.5 sm:grid-cols-2">
                {frequent.map((module) => (
                  <ToolLink
                    key={module.id}
                    module={module}
                    pathname={pathname}
                    onNavigate={onClose}
                    locked={isModuleLocked(plan, module.id)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {TOOL_GROUP_ORDER.map((group) => {
            const tools = grouped[group];
            if (!tools?.length) return null;
            return (
              <div key={group} className="mb-6">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-dim">
                  {TOOL_GROUP_LABELS[group] ?? group}
                </p>
                <div className="grid gap-0.5 sm:grid-cols-2">
                  {tools.map((module) => (
                    <ToolLink
                      key={module.id}
                      module={module}
                      pathname={pathname}
                      onNavigate={onClose}
                      locked={isModuleLocked(plan, module.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
