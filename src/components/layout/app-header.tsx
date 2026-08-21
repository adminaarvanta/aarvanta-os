"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import {
  ChevronDown,
  EllipsisVertical,
  FileText,
  Handshake,
  Plus,
  Target,
  UserPlus,
  Workflow,
  X,
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
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { BrandLogo } from "@/components/brand/logo";

const HelpMenu = dynamic(
  () => import("@/components/layout/help-menu").then((mod) => mod.HelpMenu),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-muted" />
    ),
  }
);

const NotificationsMenu = dynamic(
  () =>
    import("@/components/layout/notifications-menu").then(
      (mod) => mod.NotificationsMenu
    ),
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
  { label: "Open Partners", href: "/partners", icon: Handshake },
  { label: "Invite Team Member", href: "/team?tab=manage", icon: UserPlus },
];

export function AppHeader() {
  const [quickOpen, setQuickOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  useEffect(() => {
    if (!mobileMoreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMoreOpen]);

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center gap-2.5 border-b border-border bg-surface px-3 sm:h-16 sm:gap-3 sm:px-6">
      <Link
        href="/dashboard"
        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-visible md:hidden"
        aria-label="Aarvanta Business OS"
      >
        <BrandLogo variant="icon" size="rail" />
      </Link>

      <div className="min-w-0 flex-1">
        <GlobalSearch
          className="w-full max-w-xl"
          placeholder="Search…"
        />
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
        <NotificationsMenu />

        {/* Desktop utilities — full row */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <LanguageSwitcher />
          <Suspense fallback={null}>
            <HelpMenu />
          </Suspense>
        </div>

        {/* Mobile: collapse theme / language / help into one menu */}
        <button
          type="button"
          onClick={() => setMobileMoreOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground md:hidden"
          aria-label="More options"
          aria-expanded={mobileMoreOpen}
        >
          <EllipsisVertical className="h-5 w-5" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setQuickOpen((v) => !v)}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gold px-2.5 text-sm font-semibold text-black shadow-sm transition-colors hover:bg-gold-bright sm:gap-2 sm:px-4"
            aria-label="Quick actions"
            aria-expanded={quickOpen}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Action</span>
            <ChevronDown className="hidden h-4 w-4 opacity-80 sm:block" />
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

      {mobileMoreOpen ? (
        <div
          className="fixed inset-0 z-[70] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Header options"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close options"
            onClick={() => setMobileMoreOpen(false)}
          />
          <div className="absolute inset-x-0 top-0 border-b border-border bg-surface-elevated px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Options</p>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Theme
                </p>
                <ThemeToggle />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Language
                </p>
                <LanguageSwitcher />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Help
                </p>
                <Suspense fallback={null}>
                  <HelpMenu />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
