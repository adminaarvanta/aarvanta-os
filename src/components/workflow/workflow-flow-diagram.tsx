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
  condition: "border-violet-800/50 bg-violet-950/30 text-violet-300",
  agent: "border-[#B8965D]/40 bg-[#B8965D]/10 text-[#C9AA72]",
  approval: "border-amber-800/50 bg-amber-950/30 text-amber-300",
  action: "border-emerald-800/50 bg-emerald-950/30 text-emerald-300",
  delay: "border-slate-700/50 bg-slate-950/30 text-slate-300",
};

export function WorkflowFlowDiagram({ workflow }: { workflow: Workflow }) {
  return (
    <div className="rounded-xl border border-[#243656] bg-[#0D1524] p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#121E32] px-3 py-1 text-xs text-[#9AABC4] ring-1 ring-[#243656]">
          Trigger: {workflow.trigger.label}
        </span>
        {!workflow.enabled && (
          <span className="rounded-full bg-red-950/40 px-3 py-1 text-xs text-red-300">
            Disabled
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="w-full max-w-md rounded-lg border border-[#243656] bg-[#121E32] px-4 py-3 text-center text-sm text-[#FFFFFF]">
          {workflow.trigger.label}
        </div>

        {workflow.steps.map((step, index) => {
          const Icon = stepIcons[step.type];
          return (
            <div key={step.id} className="flex w-full max-w-md flex-col items-center gap-2">
              <ArrowDown className="h-4 w-4 text-[#243656]" aria-hidden />
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
