"use client";

import { usePathname } from "next/navigation";
import { PendingLink } from "@/components/layout/navigation-provider";
import { AGENT_DEFINITIONS } from "@/lib/workforce/agents";
import { cn } from "@/lib/utils";

const links = [
  { href: "/workforce", label: "Directory", exact: true },
  ...AGENT_DEFINITIONS.map((agent) => ({
    href: `/workforce/${agent.type}`,
    label: agent.name.replace("AI ", ""),
    exact: false,
  })),
];

export function WorkforceNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 overflow-x-auto border-b border-[#3d3528] bg-[#0a0a0a] [-webkit-overflow-scrolling:touch]"
      aria-label="AI Workforce sections"
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
