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
    <div className="px-5 sm:px-8" style={{ background: "var(--wf-bg)" }}>
      <div
        className="mx-auto flex max-w-5xl gap-1 rounded-full border bg-white p-1"
        style={{ borderColor: "var(--wf-line)" }}
        role="tablist"
        aria-label="Agent profile sections"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition"
            )}
            style={{
              background: active === tab.id ? "var(--wf-accent)" : "transparent",
              color: active === tab.id ? "#fff" : "var(--wf-muted)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
