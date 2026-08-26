"use client";

import { History, Sparkles, Zap } from "lucide-react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { cn } from "@/lib/utils";

const links = [
  {
    href: "/automation",
    id: "presets" as const,
    label: "Your automations",
    icon: Zap,
  },
  {
    href: "/automation?view=ask",
    id: "ask" as const,
    label: "Do this once",
    icon: Sparkles,
  },
  {
    href: "/automation?view=runs",
    id: "runs" as const,
    label: "History",
    icon: History,
  },
];

export function AutomationNav({
  active,
}: {
  active: "presets" | "ask" | "runs";
}) {
  return (
    <nav className="shrink-0 px-5 sm:px-8" aria-label="Automation sections">
      <div className="mx-auto flex max-w-5xl gap-1.5 overflow-x-auto pb-1">
        {links.map((link) => {
          const isActive = active === link.id;
          const Icon = link.icon;
          return (
            <PendingLink
              key={link.id}
              href={link.href}
              pendingClassName="opacity-60"
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition",
                isActive
                  ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-[0_6px_16px_rgba(109,94,246,0.28)]"
                  : "border border-border/80 bg-surface-elevated/80 text-muted hover:border-violet-400/40 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {link.label}
            </PendingLink>
          );
        })}
      </div>
    </nav>
  );
}
