import { classifyIntent } from "@/lib/ai-team/intent";
import { buildHumanPlan, type HumanPlan } from "@/lib/ai-team/plan";
import {
  startGoalPipeline,
} from "@/lib/workforce/pipeline/orchestrator";
import type { CreateGoalInput } from "@/lib/workforce/pipeline/goal-engine";
import type { TenantScope } from "@/types/communication";
import type { WorkforceExecution, WorkforceGoal } from "@/types/workforce";

export type PlanCommandResult = {
  plan: HumanPlan;
};

export type ExecuteCommandResult = {
  goal: WorkforceGoal;
  execution: WorkforceExecution;
};

/** Plan-before-act: classify prompt → human plan (no side effects). */
export function planCommand(
  prompt: string,
  extras?: Partial<
    Pick<
      CreateGoalInput,
      | "relatedContactId"
      | "relatedDealId"
      | "relatedConversationId"
    >
  >
): PlanCommandResult {
  const intent = classifyIntent(prompt, extras);
  return { plan: buildHumanPlan(intent) };
}

/** Confirm plan → start existing goal pipeline. */
export async function executeCommand(
  scope: TenantScope,
  goalInput: CreateGoalInput
): Promise<ExecuteCommandResult> {
  return startGoalPipeline({ scope, goalInput });
}
