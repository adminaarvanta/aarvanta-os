"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { WorkspaceSwitcher } from "@/components/tenant/workspace-switcher";
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
}: {
  module: { href: string; label: string; icon: LucideIcon };
  pathname: string;
  onNavigate?: () => void;
}) {
  const Icon = module.icon;
  const active = isActive(pathname, module.href);

  return (
    <PendingLink
      href={module.href}
      onClick={onNavigate}
      pendingClassName="opacity-60"
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-primary-soft text-primary"
          : "text-muted hover:bg-surface-hover hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{module.label}</span>
    </PendingLink>
  );
}

export function AllToolsPanel({
  open,
  onClose,
  pathname,
  tenant,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  tenant?: {
    organization: Organization;
    workspace: Workspace;
    workspaces: Workspace[];
  } | null;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const allModules = useMemo(() => getAllToolsModules(), []);
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
        className="fixed left-[260px] top-0 z-50 flex h-full w-[min(720px,calc(100vw-260px))] flex-col border-r border-border bg-surface shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">All tools</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border-subtle px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search modules…"
              className="w-full rounded-lg border border-border bg-surface-muted py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
          </div>
          {tenant && (
            <div className="mt-3">
              <WorkspaceSwitcher
                organization={tenant.organization}
                workspace={tenant.workspace}
                workspaces={tenant.workspaces}
              />
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!query && (
            <section className="mb-6">
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-dim">
                Frequent
              </h3>
              <div className="grid gap-1">
                {frequent.map((mod) => (
                  <ToolLink
                    key={mod.id}
                    module={mod}
                    pathname={pathname}
                    onNavigate={onClose}
                  />
                ))}
              </div>
            </section>
          )}

          {TOOL_GROUP_ORDER.map((groupKey) => {
            const items = grouped[groupKey];
            if (!items?.length) return null;
            return (
              <section key={groupKey} className="mb-6">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-dim">
                  {TOOL_GROUP_LABELS[groupKey] ?? groupKey}
                </h3>
                <div className="grid gap-1">
                  {items.map((mod) => (
                    <ToolLink
                      key={mod.id}
                      module={mod}
                      pathname={pathname}
                      onNavigate={onClose}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
