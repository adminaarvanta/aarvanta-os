"use client";

import type { ReactNode } from "react";
import {
  Briefcase,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  FileText,
  Landmark,
  LayoutDashboard,
  Receipt,
  Timer,
  UserPlus,
  Users,
} from "lucide-react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const HR_TABS = [
  { href: "/hr", label: "Overview", exact: true, icon: LayoutDashboard },
  { href: "/hr/jobs", label: "Jobs", icon: Briefcase },
  { href: "/hr/candidates", label: "Candidates", icon: UserPlus },
  { href: "/hr/onboarding", label: "Onboarding", icon: ClipboardList },
  { href: "/hr/employees", label: "Employees", icon: Users },
  { href: "/hr/punch", label: "Punch", icon: Timer },
  { href: "/hr/attendance", label: "Attendance", icon: CalendarDays },
  { href: "/hr/leave", label: "Leave", icon: CalendarDays },
  { href: "/hr/documents", label: "Documents", icon: FileText },
  { href: "/hr/invoices", label: "Invoices", icon: Receipt },
  { href: "/hr/exit", label: "Exit", icon: DoorOpen },
] as const;

export function HrNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 overflow-x-auto border-b border-border/80 bg-surface-elevated/70 backdrop-blur-md [-webkit-overflow-scrolling:touch]"
      aria-label="HR OS modules"
    >
      <div className="flex min-w-max gap-0.5 px-2 sm:px-4">
        {HR_TABS.map((link) => {
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
                  ? "text-[color:var(--hr-offer)]"
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
                    ? "bg-[color:var(--hr-offer)] opacity-100"
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

export function HrPageHeader({
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
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--hr-offer-soft)] text-[color:var(--hr-offer)]">
          <Landmark className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            HR OS
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
