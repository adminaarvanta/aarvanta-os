"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type BuildWizardStepId =
  | "about"
  | "name"
  | "goals"
  | "apps"
  | "designs"
  | "domain"
  | "generate";

export const BUILD_WIZARD_STEPS: Array<{
  id: BuildWizardStepId;
  label: string;
  description: string;
}> = [
  { id: "about", label: "About Your Site", description: "Describe the business" },
  { id: "name", label: "Site Name", description: "Name & brand vibe" },
  { id: "goals", label: "Goals", description: "What success looks like" },
  { id: "apps", label: "Add Apps", description: "Features to include" },
  { id: "designs", label: "Design", description: "Pick a homepage look" },
  { id: "domain", label: "Domain", description: "Choose or connect" },
  { id: "generate", label: "AI Generation", description: "Build your site" },
];

export function BuildWizardRail({
  step,
  completed,
  onSelect,
}: {
  step: BuildWizardStepId;
  completed: Set<BuildWizardStepId>;
  onSelect: (id: BuildWizardStepId) => void;
}) {
  const currentIdx = BUILD_WIZARD_STEPS.findIndex((s) => s.id === step);

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface-elevated md:w-[240px] md:border-b-0 md:border-r">
      <div className="border-b border-border-subtle px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
          Build OS
        </p>
        <h1 className="mt-1 text-lg font-semibold text-foreground">Create your website</h1>
        <p className="mt-1 text-xs text-muted">AI-powered site studio</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 py-3 md:flex-1 md:flex-col md:overflow-y-auto md:px-3">
        {BUILD_WIZARD_STEPS.map((item, idx) => {
          const done = completed.has(item.id) || idx < currentIdx;
          const active = item.id === step;
          const locked = idx > currentIdx && !completed.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              disabled={locked && !done}
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex min-w-[140px] items-start gap-3 rounded-xl px-3 py-2.5 text-left transition md:min-w-0",
                active
                  ? "bg-gold/15 text-foreground ring-1 ring-gold/35"
                  : done
                    ? "text-foreground hover:bg-surface-hover"
                    : "text-dim"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  active
                    ? "bg-gold text-black"
                    : done
                      ? "bg-success/20 text-success"
                      : "bg-surface-muted text-dim"
                )}
              >
                {done && !active ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="mt-0.5 hidden text-[11px] text-muted md:block">
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
