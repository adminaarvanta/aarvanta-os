"use client";

import { usePathname } from "next/navigation";
import { PendingLink } from "@/components/layout/navigation-provider";
import { AGENT_DEFINITIONS } from "@/lib/workforce/agents";
import { cn } from "@/lib/utils";

const primaryLinks = [
  { href: "/workforce", label: "Directory", exact: true },
  { href: "/workforce/tasks", label: "Tasks", exact: false },
  { href: "/workforce/approvals", label: "Approvals", exact: false },
];

const agentLinks = AGENT_DEFINITIONS.map((agent) => ({
  href: `/workforce/${agent.type}`,
  label: agent.name.replace("AI ", ""),
  exact: false,
}));

export function WorkforceNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 overflow-x-auto border-b border-border bg-surface [-webkit-overflow-scrolling:touch]"
      aria-label="AI Workforce sections"
    >
      <div className="flex min-w-max gap-1 px-3 sm:px-6">
        {primaryLinks.map((link) => {
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
                  ? "border-gold text-gold-bright"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              {link.label}
            </PendingLink>
          );
        })}
        <span className="mx-1 self-center text-border" aria-hidden>
          |
        </span>
        {agentLinks.map((link) => {
          const active = pathname.startsWith(link.href);
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
