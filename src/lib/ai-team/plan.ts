import type { ClassifiedIntent } from "@/lib/ai-team/intent";
import {
  buildWorkforceGoal,
  type CreateGoalInput,
} from "@/lib/workforce/pipeline/goal-engine";
import {
  estimateMinutesForGoal,
  selectAgentsForGoal,
} from "@/lib/workforce/pipeline/orchestrator";
import { buildTaskPlan } from "@/lib/workforce/pipeline/task-planner";
import { agentLabel } from "@/lib/workforce/pipeline/labels";
import type { TenantScope } from "@/types/communication";

const PREVIEW_SCOPE: TenantScope = {
  tenantId: "preview",
  workspaceId: "preview",
  companyId: "preview",
};

export type HumanPlanStep = {
  title: string;
  agentLabel: string;
  requiresApproval?: boolean;
};

export type HumanPlan = {
  title: string;
  summary: string;
  steps: HumanPlanStep[];
  specialists: string[];
  estimatedMinutes: { min: number; max: number };
  goalInput: CreateGoalInput;
  needsApproval: boolean;
};

/** Build a human-readable “Here’s what I’ll do…” plan without starting a job. */
export function buildHumanPlan(intent: ClassifiedIntent): HumanPlan {
  const previewGoal = buildWorkforceGoal(intent.goalInput, PREVIEW_SCOPE);
  const plan = buildTaskPlan(previewGoal);
  const { assigned } = selectAgentsForGoal(previewGoal);
  const eta = estimateMinutesForGoal(previewGoal);

  const steps: HumanPlanStep[] = plan.steps.map((s) => ({
    title: s.title,
    agentLabel: agentLabel(s.assignedAgentType ?? assigned[0] ?? "coo"),
    requiresApproval: s.requiresApproval,
  }));

  return {
    title: intent.objectiveLabel,
    summary: intent.summary,
    steps,
    specialists: assigned.map(agentLabel),
    estimatedMinutes: eta,
    goalInput: intent.goalInput,
    needsApproval: steps.some((s) => s.requiresApproval),
  };
}
