"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Lock, LogOut, MoreHorizontal, X } from "lucide-react";
import { PendingLink } from "@/components/layout/navigation-provider";
import {
  MOBILE_NAV,
  mobileMoreNav,
} from "@/lib/navigation/command-center-nav";
import { cn } from "@/lib/utils";
import { isNavHrefLocked, usePlan } from "@/components/billing/plan-context";
import { PremiumBadge } from "@/components/billing/plan-ui";

function tourNavId(href: string) {
  return href.replace(/^\//, "").replace(/\//g, "-") || "home";
}

function isMobileActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname.startsWith("/dashboard");
  if (href === "/crm") return pathname.startsWith("/crm");
  if (href === "/automation") {
    return (
      pathname.startsWith("/automation") ||
      pathname.startsWith("/workforce") ||
      pathname.startsWith("/workflows")
    );
  }
  return pathname.startsWith(href);
}

export function MobileNav({
  production,
  showWhatsAppNav = false,
  showOutreachNav = false,
}: {
  production: boolean;
  showWhatsAppNav?: boolean;
  showOutreachNav?: boolean;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const plan = usePlan();
  // Keep all primary tabs visible; locked ones show a lock icon.
  const primary = MOBILE_NAV.slice(0, 4);
  const moreItems = mobileMoreNav(showWhatsAppNav, showOutreachNav);

  const moreActive = moreItems.some((item) =>
    isMobileActive(pathname, item.href)
  );

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [moreOpen]);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Main navigation"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 items-stretch gap-0 px-1 pt-1">
          {primary.map((item) => {
            const Icon = item.icon;
            const locked = isNavHrefLocked(plan, item.href);
            const active = !locked && isMobileActive(pathname, item.href);
            const href = locked
              ? `/billing?upgrade=${item.href.replace(/^\//, "")}`
              : item.href;
            return (
              <PendingLink
                key={item.href}
                href={href}
                data-demo-tour={`mobile-nav-${tourNavId(item.href)}`}
                pendingClassName="opacity-60"
                title={locked ? `${item.label} — upgrade to unlock` : item.label}
                className={cn(
                  "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium leading-none transition-colors",
                  locked
                    ? "text-muted"
                    : active
                      ? "text-primary"
                      : "text-muted"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="max-w-full truncate">{item.label}</span>
                {locked ? (
                  <Lock
                    className="absolute right-1 top-1 h-2.5 w-2.5 text-gold"
                    aria-hidden
                  />
                ) : null}
              </PendingLink>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium leading-none transition-colors",
              moreOpen || moreActive ? "text-primary" : "text-muted"
            )}
            aria-label="More navigation"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal className="h-5 w-5 shrink-0" aria-hidden />
            <span>More</span>
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div
          className="fixed inset-0 z-[60] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="More"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close more menu"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[min(72vh,28rem)] overflow-y-auto rounded-t-2xl border border-border bg-surface-elevated shadow-2xl"
            style={{
              paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
            }}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-border-subtle bg-surface-elevated px-4 py-3">
              <p className="text-sm font-semibold text-foreground">More</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="divide-y divide-border-subtle px-2 py-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const locked = isNavHrefLocked(plan, item.href);
                const active = !locked && isMobileActive(pathname, item.href);
                const href = locked
                  ? `/billing?upgrade=${item.href.replace(/^\//, "")}`
                  : item.href;
                return (
                  <li key={item.href}>
                    <PendingLink
                      href={href}
                      data-demo-tour={`mobile-nav-${tourNavId(item.href)}`}
                      onClick={() => setMoreOpen(false)}
                      pendingClassName="opacity-60"
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                        locked
                          ? "text-muted hover:bg-gold/10"
                          : active
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-surface-hover"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0 text-gold" aria-hidden />
                      <span className="flex-1">{item.label}</span>
                      {locked ? <PremiumBadge /> : null}
                    </PendingLink>
                  </li>
                );
              })}
              {production ? (
                <li>
                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                    >
                      <LogOut className="h-5 w-5 shrink-0" aria-hidden />
                      Sign out
                    </button>
                  </form>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
