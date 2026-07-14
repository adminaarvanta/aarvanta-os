import Link from "next/link";
import {
  ArrowDown,
  Bot,
  Clock,
  GitBranch,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Workflow, WorkflowStep } from "@/types/workflow";
import { cn } from "@/lib/utils";

const stepIcons: Record<WorkflowStep["type"], typeof Zap> = {
  condition: GitBranch,
  agent: Bot,
  approval: ShieldCheck,
  action: Zap,
  delay: Clock,
};

const stepColors: Record<WorkflowStep["type"], string> = {
  condition: "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan",
  agent: "border-gold/40 bg-gold/10 text-gold-bright",
  approval: "border-gold/35 bg-gold/10 text-gold-bright",
  action: "border-accent-cyan/30 bg-accent-cyan/15 text-accent-cyan",
  delay: "border-border bg-surface-muted text-muted",
};

export function WorkflowFlowDiagram({ workflow }: { workflow: Workflow }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface-muted px-3 py-1 text-xs text-muted ring-1 ring-border">
          Trigger: {workflow.trigger.label}
        </span>
        {!workflow.enabled && (
          <span className="rounded-full bg-danger/15 px-3 py-1 text-xs text-danger">
            Disabled
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="w-full max-w-md rounded-lg border border-border bg-surface-muted px-4 py-3 text-center text-sm text-foreground">
          {workflow.trigger.label}
        </div>

        {workflow.steps.map((step, index) => {
          const Icon = stepIcons[step.type];
          return (
            <div key={step.id} className="flex w-full max-w-md flex-col items-center gap-2">
              <ArrowDown className="h-4 w-4 text-border" aria-hidden />
              <div
                className={cn(
                  "w-full rounded-lg border px-4 py-3",
                  stepColors[step.type]
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide opacity-70">
                      {step.type}
                    </p>
                    <p className="text-sm font-medium">{step.label}</p>
                  </div>
                  <span className="ml-auto text-[10px] opacity-60">#{index + 1}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
