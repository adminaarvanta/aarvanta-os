"use client";

import { cn } from "@/lib/utils";

const tabs = [
  { id: "run", label: "Run" },
  { id: "chat", label: "Chat" },
  { id: "memory", label: "Memory" },
  { id: "tasks", label: "Tasks" },
] as const;

export type AgentProfileTab = (typeof tabs)[number]["id"];

export function AgentProfileTabs({
  active,
  onChange,
}: {
  active: AgentProfileTab;
  onChange: (tab: AgentProfileTab) => void;
}) {
  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-[#3d3528] [-webkit-overflow-scrolling:touch]"
      aria-label="Agent profile sections"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
            active === tab.id
              ? "border-[#D4AF37] text-[#F9E076]"
              : "border-transparent text-[#A89878] hover:text-[#F5E6C8]"
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
