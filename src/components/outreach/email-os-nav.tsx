"use client";

import { LayoutDashboard, Mail, Megaphone, Settings2, FileCode2 } from "lucide-react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/outreach", label: "Dashboard", exact: true, icon: LayoutDashboard },
  { href: "/outreach/campaigns", label: "Campaigns", exact: false, icon: Megaphone },
  { href: "/outreach/templates", label: "Templates", exact: false, icon: FileCode2 },
  { href: "/outreach/settings", label: "Settings", exact: false, icon: Settings2 },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function EmailOsNav() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 px-5 sm:px-8" aria-label="Email OS sections">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
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
                  ? "bg-gradient-to-r from-[#2f7f92] to-[#1a2f59] text-white shadow-[0_6px_16px_rgba(47,127,146,0.28)]"
                  : "border border-border/80 bg-surface-elevated/80 text-muted hover:border-cyan-400/40 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {link.label}
            </PendingLink>
          );
        })}
        <span className="ml-1 hidden items-center gap-1 self-center text-[11px] font-semibold uppercase tracking-wide text-muted sm:inline-flex">
          <Mail className="h-3 w-3" aria-hidden />
          Super admin
        </span>
      </div>
    </nav>
  );
}
