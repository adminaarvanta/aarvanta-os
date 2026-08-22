"use client";

import type { ReactNode } from "react";
import {
  BookOpen,
  LayoutDashboard,
  PieChart,
  Receipt,
  Scale,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const FINANCE_TABS = [
  { href: "/finance", label: "Overview", exact: true, icon: LayoutDashboard },
  { href: "/finance/invoices", label: "Invoices", icon: Receipt },
  { href: "/finance/expenses", label: "Expenses", icon: WalletCards },
  { href: "/finance/customers", label: "Customers", icon: Users },
  { href: "/finance/ledger", label: "Ledger", icon: BookOpen },
  { href: "/finance/reports", label: "Reports", icon: PieChart },
  { href: "/finance/accounts", label: "Accounts", icon: Scale },
  { href: "/finance/budgets", label: "Budgets", icon: Wallet },
] as const;

export function FinanceNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 overflow-x-auto border-b border-border/80 bg-surface-elevated/70 backdrop-blur-md [-webkit-overflow-scrolling:touch]"
      aria-label="Finance OS modules"
    >
      <div className="flex min-w-max gap-0.5 px-2 sm:px-4">
        {FINANCE_TABS.map((link) => {
          const active =
            "exact" in link && link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <PendingLink
              key={link.href}
              href={link.href}
              pendingClassName="opacity-60"
              className={cn(
                "group relative flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "text-[color:var(--finance-accent)]"
                  : "text-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  active && "scale-110"
                )}
                aria-hidden
              />
              {link.label}
              <span
                className={cn(
                  "absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-all",
                  active
                    ? "bg-[color:var(--finance-accent)] opacity-100"
                    : "bg-transparent opacity-0 group-hover:bg-border group-hover:opacity-100"
                )}
              />
            </PendingLink>
          );
        })}
      </div>
    </nav>
  );
}

export function FinancePageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--finance-accent-soft)] text-[color:var(--finance-accent)]">
          <Wallet className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Finance OS
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {actions}
    </header>
  );
}
