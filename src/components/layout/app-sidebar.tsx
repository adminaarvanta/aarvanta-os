import Link from "next/link";
import {
  Inbox,
  MessageSquare,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/inbox", label: "Unified Inbox", icon: Inbox, active: true },
  {
    href: "#",
    label: "CRM",
    icon: MessageSquare,
    active: false,
    disabled: true,
    hint: "Module 2",
  },
  {
    href: "#",
    label: "AI Workforce",
    icon: Sparkles,
    active: false,
    disabled: true,
    hint: "Module 3",
  },
  {
    href: "#",
    label: "Settings",
    icon: Settings,
    active: false,
    disabled: true,
  },
];

export function AppSidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[#EDE6D6] bg-white">
      <div className="border-b border-[#EDE6D6] px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C29B40]">
          Aarvanta OS
        </p>
        <h1 className="mt-1 text-lg font-semibold text-[#2A2418]">
          Communication Hub
        </h1>
        <p className="mt-0.5 text-xs text-[#6B6356]">Module 1</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.hint && (
                <span className="text-[10px] text-[#6B6356]">{item.hint}</span>
              )}
            </>
          );
          if (item.disabled) {
            return (
              <span
                key={item.label}
                className="flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#6B6356]/60"
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
                item.active
                  ? "bg-[#E8D4A8]/50 text-[#2A2418]"
                  : "text-[#6B6356] hover:bg-[#FCF9F2]"
              )}
            >
              {content}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#EDE6D6] p-4 text-[10px] text-[#6B6356]">
        Demo workspace · Firebase & auth coming next
      </div>
    </aside>
  );
}
