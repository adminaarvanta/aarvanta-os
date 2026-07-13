"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useState } from "react";
import {
  Bell,
  ChevronDown,
  Plus,
  UserPlus,
  FileText,
  Workflow,
  Target,
} from "lucide-react";

const GlobalSearch = dynamic(
  () =>
    import("@/components/layout/global-search").then((mod) => mod.GlobalSearch),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-full max-w-xl animate-pulse rounded-xl bg-surface-muted" />
    ),
  }
);

import { ThemeToggle } from "@/components/theme/theme-toggle";

const HelpMenu = dynamic(
  () => import("@/components/layout/help-menu").then((mod) => mod.HelpMenu),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-muted" />
    ),
  }
);

const quickActions = [
  { label: "Add New Lead", href: "/crm/leads", icon: Target },
  { label: "Create Workflow", href: "/workflows", icon: Workflow },
  { label: "Generate Report", href: "/analytics", icon: FileText },
  { label: "Invite Team Member", href: "/settings", icon: UserPlus },
];

export function AppHeader() {
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <header className="relative z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <GlobalSearch className="w-full max-w-xl" placeholder="Search across OS…" />
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="relative rounded-lg p-2.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-black">
            5
          </span>
        </button>

        <ThemeToggle />

        <Suspense fallback={null}>
          <HelpMenu />
        </Suspense>

        <div className="relative">
          <button
            type="button"
            onClick={() => setQuickOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-3 py-2.5 text-sm font-semibold text-black shadow-sm transition-colors hover:bg-gold-bright sm:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Action</span>
            <ChevronDown className="h-4 w-4 opacity-80" />
          </button>

          {quickOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Close quick actions"
                onClick={() => setQuickOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-lg">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      onClick={() => setQuickOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover"
                    >
                      <Icon className="h-4 w-4 text-gold" />
                      {action.label}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
