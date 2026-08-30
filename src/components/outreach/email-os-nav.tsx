"use client";

import { LayoutDashboard, Mail, Megaphone, Settings2 } from "lucide-react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/outreach", label: "Dashboard", exact: true, icon: LayoutDashboard },
  { href: "/outreach/campaigns", label: "Campaigns", exact: false, icon: Megaphone },
  { href: "/outreach/settings", label: "Settings", exact: false, icon: Settings2 },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function EmailOsNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 border-b border-border bg-gradient-to-r from-[rgba(14,165,198,0.08)] via-surface to-[rgba(26,47,89,0.06)] [-webkit-overflow-scrolling:touch]"
      aria-label="Email Outreach sections"
    >
      <div className="flex min-w-max gap-1.5 overflow-x-auto px-3 py-2.5 sm:px-5">
        {links.map((link) => {
          const active = isActive(pathname, link.href, link.exact);
          const Icon = link.icon;
          return (
            <PendingLink
              key={link.href}
              href={link.href}
              pendingClassName="opacity-60"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                active
                  ? "bg-[var(--navy)] text-white shadow-sm dark:bg-gold dark:text-[var(--navy)]"
                  : "text-muted hover:bg-surface-elevated hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5 opacity-90" />
              {link.label}
            </PendingLink>
          );
        })}
        <span className="ml-1 hidden items-center gap-1 self-center text-[11px] font-medium uppercase tracking-wide text-muted sm:inline-flex">
          <Mail className="h-3 w-3" />
          Super admin
        </span>
      </div>
    </nav>
  );
}
