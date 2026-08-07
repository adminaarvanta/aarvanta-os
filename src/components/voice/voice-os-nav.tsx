"use client";

import {
  BarChart3,
  Bot,
  CalendarDays,
  History,
  LayoutDashboard,
  Megaphone,
  Phone,
  PhoneCall,
  Radio,
  Settings2,
  Users,
} from "lucide-react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/voice", label: "Dashboard", exact: true, icon: LayoutDashboard },
  { href: "/voice/dialer", label: "Dialer", exact: false, icon: Phone },
  { href: "/voice/agents", label: "Agents", exact: false, icon: Bot },
  { href: "/voice/campaigns", label: "Campaigns", exact: false, icon: Megaphone },
  { href: "/voice/live", label: "Live Calls", exact: false, icon: Radio },
  { href: "/voice/queue", label: "Queue", exact: false, icon: Users },
  { href: "/voice/meetings", label: "Meetings", exact: false, icon: PhoneCall },
  { href: "/voice/calendar", label: "Calendar", exact: false, icon: CalendarDays },
  { href: "/voice/history", label: "Call History", exact: false, icon: History },
  { href: "/voice/insights", label: "Insights", exact: false, icon: BarChart3 },
  { href: "/voice/settings", label: "Settings", exact: false, icon: Settings2 },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function VoiceOsNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 border-b border-border bg-gradient-to-r from-[rgba(26,47,89,0.06)] via-surface to-[rgba(168,137,79,0.08)] [-webkit-overflow-scrolling:touch]"
      aria-label="Voice OS sections"
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
      </div>
    </nav>
  );
}
