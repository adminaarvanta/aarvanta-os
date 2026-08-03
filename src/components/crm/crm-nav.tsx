"use client";

import { PendingLink } from "@/components/layout/navigation-provider";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/crm", label: "Dashboard", exact: true },
  { href: "/crm/people", label: "People", exact: false },
  { href: "/crm/companies", label: "Companies", exact: false },
  { href: "/crm/sales", label: "Sales", exact: false },
  { href: "/crm/conversations", label: "Conversations", exact: false },
  { href: "/crm/calendar", label: "Calendar", exact: false },
  { href: "/crm/activity", label: "Activity", exact: false },
];

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
      className="shrink-0 overflow-x-auto border-b border-border bg-surface [-webkit-overflow-scrolling:touch]"
      aria-label="CRM sections"
    >
      <div className="flex min-w-max gap-1 px-3 sm:px-6">
        {links.map((link) => {
          const active = isActive(pathname, link.href, link.exact);
          return (
            <PendingLink
              key={link.href}
              href={link.href}
              pendingClassName="opacity-60"
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-gold text-gold-bright"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              {link.label}
            </PendingLink>
          );
        })}
      </div>
    </nav>
  );
}
