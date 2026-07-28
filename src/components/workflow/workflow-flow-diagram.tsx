import {
  ArrowDown,
  Bot,
  Clock,
  GitBranch,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Workflow, WorkflowStep } from "@/types/workflow";
import { FlowChip, FlowPanel } from "@/components/workflow/workflow-shell";

const stepIcons: Record<WorkflowStep["type"], typeof Zap> = {
  condition: GitBranch,
  agent: Bot,
  approval: ShieldCheck,
  action: Zap,
  delay: Clock,
};

const stepColors: Record<WorkflowStep["type"], { soft: string; fg: string }> = {
  condition: { soft: "var(--flow-cyan-soft)", fg: "var(--flow-cyan)" },
  agent: { soft: "var(--flow-accent-soft)", fg: "var(--flow-accent)" },
  action: { soft: "var(--flow-emerald-soft)", fg: "var(--flow-emerald)" },
  approval: { soft: "var(--flow-rose-soft)", fg: "var(--flow-rose)" },
  delay: { soft: "var(--flow-amber-soft)", fg: "var(--flow-amber)" },
};

export function WorkflowFlowDiagram({ workflow }: { workflow: Workflow }) {
  return (
    <FlowPanel>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FlowChip tone="cyan">Trigger: {workflow.trigger.label}</FlowChip>
        {!workflow.enabled && <FlowChip tone="danger">Disabled</FlowChip>}
      </div>

      <div className="flex flex-col items-center gap-2">
        <div
          className="w-full max-w-md rounded-xl px-4 py-3 text-center text-sm font-semibold"
          style={{
            background: "var(--flow-accent-soft)",
            color: "var(--flow-accent)",
          }}
        >
          {workflow.trigger.label}
        </div>

        {workflow.steps.map((step, index) => {
          const Icon = stepIcons[step.type];
          const colors = stepColors[step.type];
          return (
            <div
              key={step.id}
              className="flex w-full max-w-md flex-col items-center gap-2"
            >
              <ArrowDown
                className="h-4 w-4"
                style={{ color: "var(--flow-line)" }}
                aria-hidden
              />
              <div
                className="w-full rounded-xl border px-4 py-3"
                style={{
                  borderColor: colors.fg,
                  background: colors.soft,
                  color: colors.fg,
                }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide opacity-70">
                      {step.type}
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--flow-ink)" }}
                    >
                      {step.label}
                    </p>
                  </div>
                  <span className="ml-auto text-[10px] opacity-60">
                    #{index + 1}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </FlowPanel>
  );
}
