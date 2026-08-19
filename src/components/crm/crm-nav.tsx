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
    <nav
      className="shrink-0 overflow-x-auto border-b border-border/80 bg-surface-elevated/70 backdrop-blur-md [-webkit-overflow-scrolling:touch]"
      aria-label="CRM sections"
    >
      <div className="flex min-w-max gap-0.5 px-2 sm:px-4">
        {links.map((link) => {
          const active = isActive(pathname, link.href, link.exact);
          const Icon = link.icon;
          return (
            <PendingLink
              key={link.href}
              href={link.href}
              pendingClassName="opacity-60"
              className={cn(
                "group relative flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors",
                active ? "text-gold-bright" : "text-muted hover:text-foreground"
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
                    ? "bg-gold opacity-100"
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
