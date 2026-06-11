"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/inbox", label: "Unified Inbox", icon: Inbox, module: "Module 1" },
  { href: "/crm", label: "CRM", icon: LayoutDashboard, module: "Module 2" },
  {
    href: "#",
    label: "AI Workforce",
    icon: Sparkles,
    disabled: true,
    module: "Module 3",
  },
  {
    href: "#",
    label: "Settings",
    icon: Settings,
    disabled: true,
  },
];

export function AppSidebar({ production }: { production: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-[#3d3528] bg-[#0a0a0a]">
      <div className="border-b border-[#3d3528] px-4 py-5">
        <BrandLogo href="/inbox" fullWidth />
        <p className="mt-3 text-xs text-[#A89878]">Modules 1–2</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            !item.disabled &&
            (item.href === "/crm"
              ? pathname.startsWith("/crm")
              : pathname.startsWith(item.href));
          const content = (
            <>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.module && (
                <span className="text-[10px] text-[#A89878]">{item.module}</span>
              )}
            </>
          );
          if (item.disabled) {
            return (
              <span
                key={item.label}
                className="flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#A89878]/40"
              >
                {content}
              </span>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#D4AF37]/15 text-[#F9E076] ring-1 ring-[#D4AF37]/30"
                  : "text-[#A89878] hover:bg-[#1a1714] hover:text-[#F5E6C8]"
              )}
            >
              {content}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#3d3528] p-4 text-[10px] text-[#A89878] space-y-2">
        <Link
          href="/chat"
          target="_blank"
          className="block text-[#D4AF37] hover:text-[#F9E076] hover:underline"
        >
          Open website chat (test)
        </Link>
        <p>
          {production
            ? "Production · Firestore persistence"
            : "Demo mode · in-memory data"}
        </p>
        {production && (
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-[#D4AF37] hover:text-[#F9E076] hover:underline"
            >
              Sign out
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
