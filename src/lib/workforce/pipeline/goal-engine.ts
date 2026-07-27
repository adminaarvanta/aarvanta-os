import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { GOAL_OBJECTIVE_LABELS } from "@/lib/workforce/pipeline/labels";
import type { TenantScope } from "@/types/communication";
import type {
  BusinessModuleHint,
  GoalObjective,
  GoalPriority,
  WorkforceGoal,
} from "@/types/workforce";

export { GOAL_OBJECTIVE_LABELS } from "@/lib/workforce/pipeline/labels";

const GOAL_DEFAULTS: Record<
  Exclude<GoalObjective, "custom">,
  {
    priority: GoalPriority;
    deadlineHours: number;
    expectedOutcome: string;
    moduleHint: BusinessModuleHint;
  }
> = {
  close_lead: {
    priority: "high",
    deadlineHours: 48,
    expectedOutcome: "Meeting Scheduled",
    moduleHint: "crm",
  },
  follow_up: {
    priority: "medium",
    deadlineHours: 24,
    expectedOutcome: "Follow-up Sent",
    moduleHint: "crm",
  },
  recover_customer: {
    priority: "high",
    deadlineHours: 72,
    expectedOutcome: "Customer Re-engaged",
    moduleHint: "crm",
  },
  book_meeting: {
    priority: "high",
    deadlineHours: 24,
    expectedOutcome: "Meeting Booked",
    moduleHint: "crm",
  },
  generate_proposal: {
    priority: "medium",
    deadlineHours: 48,
    expectedOutcome: "Proposal Draft Ready",
    moduleHint: "crm",
  },
};

export type CreateGoalInput = {
  objective: GoalObjective;
  customObjective?: string;
  instructions?: string;
  relatedContactId?: string;
  relatedDealId?: string;
  relatedConversationId?: string;
  priority?: GoalPriority;
  deadlineHours?: number;
  expectedOutcome?: string;
  moduleHint?: BusinessModuleHint;
};

/** Goal Engine — understands business intent only; never executes. */
export function buildWorkforceGoal(
  input: CreateGoalInput,
  scope: TenantScope
): WorkforceGoal {
  const defaults =
    input.objective === "custom"
      ? {
          priority: "medium" as GoalPriority,
          deadlineHours: 48,
          expectedOutcome: "Goal Completed",
          moduleHint: "operations" as BusinessModuleHint,
        }
      : GOAL_DEFAULTS[input.objective];

  const expectedOutcome =
    input.expectedOutcome ??
    (input.objective === "custom" && input.customObjective
      ? input.customObjective
      : defaults.expectedOutcome);

  return {
    ...scope,
    id: crmNewId("wf_goal"),
    objective: input.objective,
    customObjective:
      input.objective === "custom" ? input.customObjective?.trim() : undefined,
    priority: input.priority ?? defaults.priority,
    deadlineHours: input.deadlineHours ?? defaults.deadlineHours,
    expectedOutcome,
    relatedContactId: input.relatedContactId,
    relatedDealId: input.relatedDealId,
    relatedConversationId: input.relatedConversationId,
    moduleHint: input.moduleHint ?? defaults.moduleHint,
    instructions: input.instructions?.trim() || undefined,
    status: "created",
    createdAt: crmNow(),
  };
}

export function goalDisplayLabel(goal: WorkforceGoal): string {
  if (goal.objective === "custom") {
    return goal.customObjective?.trim() || GOAL_OBJECTIVE_LABELS.custom;
  }
  return GOAL_OBJECTIVE_LABELS[goal.objective];
}
