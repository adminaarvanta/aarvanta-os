"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { MOBILE_NAV } from "@/lib/navigation/command-center-nav";
import { cn } from "@/lib/utils";

function tourNavId(href: string) {
  return href.replace(/^\//, "").replace(/\//g, "-") || "home";
}

function isMobileActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname.startsWith("/dashboard");
  if (href === "/crm") return pathname.startsWith("/crm");
  return pathname.startsWith(href);
}

export function MobileNav({ production }: { production: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around px-1 pt-1">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active = isMobileActive(pathname, item.href);
          return (
            <PendingLink
              key={item.href}
              href={item.href}
              data-demo-tour={`mobile-nav-${tourNavId(item.href)}`}
              pendingClassName="opacity-60"
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">{item.label}</span>
            </PendingLink>
          );
        })}
        {production && (
          <form action="/api/auth/logout" method="post" className="flex min-w-0 flex-1">
            <button
              type="submit"
              className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1.5 py-2 text-[10px] font-medium text-muted transition-colors hover:text-primary"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden />
              <span>Sign out</span>
            </button>
          </form>
        )}
      </div>
    </nav>
  );
}
