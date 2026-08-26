"use client";

import { usePathname } from "next/navigation";
import { PendingLink } from "@/components/layout/navigation-provider";
import { cn } from "@/lib/utils";

const links = [
  { href: "/automation?view=ask", label: "Chat", exact: false },
  { href: "/workforce/jobs", label: "Jobs", exact: false },
  { href: "/workforce/waiting", label: "Waiting for You", exact: false },
  { href: "/workforce/activity", label: "Activity", exact: false },
  { href: "/workforce/settings", label: "Settings", exact: false },
];

export function WorkforceNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 px-5 sm:px-8"
      style={{ background: "var(--wf-bg)" }}
      aria-label="AI Team sections"
    >
      <div
        className="mx-auto flex max-w-5xl gap-1 overflow-x-auto border-b"
        style={{ borderColor: "var(--wf-line)" }}
      >
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
                "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-[var(--wf-accent)] text-[var(--wf-accent)]"
                  : "border-transparent text-[var(--wf-muted)] hover:text-[var(--wf-ink)]"
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
