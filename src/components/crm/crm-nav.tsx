"use client";

import {
  Building2,
  CalendarDays,
  Kanban,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Users,
} from "lucide-react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/crm", label: "Dashboard", exact: true, icon: LayoutDashboard },
  { href: "/crm/people", label: "People", exact: false, icon: Users },
  { href: "/crm/companies", label: "Companies", exact: false, icon: Building2 },
  { href: "/crm/sales", label: "Sales", exact: false, icon: Kanban },
  {
    href: "/crm/conversations",
    label: "Conversations",
    exact: false,
    icon: MessageSquare,
  },
  { href: "/crm/calendar", label: "Calendar", exact: false, icon: CalendarDays },
  { href: "/crm/activity", label: "Activity", exact: false, icon: ListTodo },
] as const;

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  if (href === "/crm/people") {
    return (
      pathname.startsWith("/crm/people") ||
      pathname.startsWith("/crm/contacts") ||
      pathname.startsWith("/crm/leads")
    );
  }
  if (href === "/crm/sales") {
    return (
      pathname.startsWith("/crm/sales") ||
      pathname.startsWith("/crm/pipelines") ||
      pathname.startsWith("/crm/deals")
    );
  }
  if (href === "/crm/activity") {
    return (
      pathname.startsWith("/crm/activity") || pathname.startsWith("/crm/tasks")
    );
  }
  return pathname.startsWith(href);
}

export function CrmNav() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 px-5 sm:px-8" aria-label="CRM sections">
      <div className="mx-auto flex max-w-5xl gap-1.5 overflow-x-auto pb-1">
        {links.map((link) => {
          const active = isActive(pathname, link.href, link.exact);
          const Icon = link.icon;
          return (
            <PendingLink
              key={link.href}
              href={link.href}
              pendingClassName="opacity-60"
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition",
                active
                  ? "bg-gradient-to-r from-[#1a2f59] to-[#2f7f92] text-white shadow-[0_6px_16px_rgba(26,47,89,0.28)]"
                  : "border border-border/80 bg-surface-elevated/80 text-muted hover:border-gold/40 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {link.label}
            </PendingLink>
          );
        })}
      </div>
    </nav>
  );
}
