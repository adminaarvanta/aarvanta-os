"use client";

import { PendingLink } from "@/components/layout/navigation-provider";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/voice", label: "Dashboard", exact: true },
  { href: "/voice/agents", label: "AI Employees", exact: false },
  { href: "/voice/campaigns", label: "Campaigns", exact: false },
  { href: "/voice/live", label: "Live Calls", exact: false },
  { href: "/voice/queue", label: "Queue", exact: false },
  { href: "/voice/meetings", label: "Meetings", exact: false },
  { href: "/voice/calendar", label: "Calendar", exact: false },
  { href: "/voice/history", label: "Call History", exact: false },
  { href: "/voice/insights", label: "Insights", exact: false },
  { href: "/voice/settings", label: "Settings", exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function VoiceOsNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 overflow-x-auto border-b border-border bg-surface [-webkit-overflow-scrolling:touch]"
      aria-label="Voice OS sections"
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
