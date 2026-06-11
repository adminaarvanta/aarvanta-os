"use client";

import { PendingLink } from "@/components/layout/navigation-provider";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/crm", label: "Overview", exact: true },
  { href: "/crm/contacts", label: "Contacts" },
  { href: "/crm/companies", label: "Companies" },
  { href: "/crm/pipelines", label: "Pipelines" },
  { href: "/crm/tasks", label: "Tasks" },
];

export function CrmNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 overflow-x-auto border-b border-[#3d3528] bg-[#0a0a0a] [-webkit-overflow-scrolling:touch]"
      aria-label="CRM sections"
    >
      <div className="flex min-w-max gap-1 px-3 sm:px-6">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <PendingLink
              key={link.href}
              href={link.href}
              pendingClassName="opacity-60"
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-[#D4AF37] text-[#F9E076]"
                  : "border-transparent text-[#A89878] hover:text-[#F5E6C8]"
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
