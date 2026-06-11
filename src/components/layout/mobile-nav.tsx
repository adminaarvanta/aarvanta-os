"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, LayoutDashboard, MessageCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/inbox", label: "Inbox", icon: Inbox, match: (p: string) => p.startsWith("/inbox") },
  { href: "/crm", label: "CRM", icon: LayoutDashboard, match: (p: string) => p.startsWith("/crm") },
  { href: "/chat", label: "Chat", icon: MessageCircle, match: () => false },
];

export function MobileNav({ production }: { production: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#3d3528] bg-[#0a0a0a]/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around px-2 pt-1">
        {links.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              target={item.href === "/chat" ? "_blank" : undefined}
              rel={item.href === "/chat" ? "noopener noreferrer" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-[10px] font-medium transition-colors",
                active ? "text-[#F9E076]" : "text-[#A89878]"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {production && (
          <form action="/api/auth/logout" method="post" className="flex min-w-0 flex-1">
            <button
              type="submit"
              className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-[10px] font-medium text-[#A89878]"
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
