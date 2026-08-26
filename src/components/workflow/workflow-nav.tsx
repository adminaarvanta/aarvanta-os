"use client";

import { PendingLink } from "@/components/layout/navigation-provider";
import { cn } from "@/lib/utils";

type HubTab = "templates" | "automations" | "runs";

/** Underline section nav — matches AI Workforce. */
export function WorkflowNav({
  activeTab,
  onTabChange,
}: {
  activeTab?: HubTab;
  onTabChange?: (tab: HubTab) => void;
}) {
  if (activeTab && onTabChange) {
    const hubTabs: Array<{ id: HubTab; label: string }> = [
      { id: "templates", label: "Playbooks" },
      { id: "automations", label: "My plays" },
      { id: "runs", label: "Runs" },
    ];
    return (
      <nav
        className="shrink-0 px-5 sm:px-8"
        style={{ background: "var(--flow-bg)" }}
        aria-label="Workflow sections"
      >
        <div
          className="mx-auto flex max-w-5xl gap-1 border-b"
          style={{ borderColor: "var(--flow-line)" }}
        >
          {hubTabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-[var(--flow-accent)] text-[var(--flow-accent)]"
                    : "border-transparent text-[var(--flow-muted)] hover:text-[var(--flow-ink)]"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="shrink-0 px-5 sm:px-8"
      style={{ background: "var(--flow-bg)" }}
      aria-label="Workflow sections"
    >
      <div
        className="mx-auto flex max-w-5xl gap-1 border-b"
        style={{ borderColor: "var(--flow-line)" }}
      >
        <PendingLink
          href="/automation"
          pendingClassName="opacity-60"
          className="whitespace-nowrap border-b-2 border-[var(--flow-accent)] px-3 py-2.5 text-sm font-medium text-[var(--flow-accent)]"
        >
          Automation
        </PendingLink>
      </div>
    </nav>
  );
}
