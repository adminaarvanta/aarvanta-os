"use client";

import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/lib/ui/focus";

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ id: string; label: string; disabled?: boolean; hint?: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      className="flex flex-wrap gap-1 border-b border-border"
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={tab.disabled}
            title={tab.hint}
            onClick={() => onChange(tab.id)}
            className={cn(
              "rounded-t-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              FOCUS_RING,
              selected
                ? "border-b-2 border-gold text-foreground"
                : "text-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
