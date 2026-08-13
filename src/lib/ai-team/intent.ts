import { promptToGoalPayload } from "@/lib/workforce/prompt-to-goal";
import {
  buildWorkforceGoal,
  goalDisplayLabel,
  type CreateGoalInput,
} from "@/lib/workforce/pipeline/goal-engine";
import { selectAgentsForGoal } from "@/lib/workforce/pipeline/orchestrator";
import { GOAL_OBJECTIVE_LABELS, agentLabel } from "@/lib/workforce/pipeline/labels";
import type { TenantScope } from "@/types/communication";
import type { AgentType } from "@/types/workforce";

export type ClassifiedIntent = {
  prompt: string;
  goalInput: CreateGoalInput;
  suggestedAgents: AgentType[];
  monitoringAgents: AgentType[];
  /** One-line intent summary for the plan card. */
  summary: string;
  objectiveLabel: string;
};

const PREVIEW_SCOPE: TenantScope = {
  tenantId: "preview",
  workspaceId: "preview",
  companyId: "preview",
};

/**
 * Classify a free-text prompt into a goal payload + suggested specialists.
 * Uses Phase 1 heuristics; no LLM call.
 */
export function classifyIntent(
  prompt: string,
  extras?: Partial<
    Pick<
      CreateGoalInput,
      | "relatedContactId"
      | "relatedDealId"
      | "relatedConversationId"
    >
  >
): ClassifiedIntent {
  const text = prompt.trim();
  const payload = promptToGoalPayload(text);
  const goalInput: CreateGoalInput = {
    ...payload,
    relatedContactId: extras?.relatedContactId,
    relatedDealId: extras?.relatedDealId,
    relatedConversationId: extras?.relatedConversationId,
    // Preserve free-text for Knowledge Hub grounding in buildWorkforceContext.
    instructions: [payload.instructions, text ? `User request: ${text}` : ""]
      .filter(Boolean)
      .join("\n"),
  };

  const previewGoal = buildWorkforceGoal(goalInput, PREVIEW_SCOPE);
  const { assigned, monitoring } = selectAgentsForGoal(previewGoal);
  const objectiveLabel =
    previewGoal.objective === "custom"
      ? goalDisplayLabel(previewGoal)
      : GOAL_OBJECTIVE_LABELS[previewGoal.objective];

  const specialistNames = assigned.map(agentLabel).join(", ");
  const summary =
    previewGoal.objective === "custom"
      ? `I’ll run “${objectiveLabel}” with ${specialistNames}.`
      : `I’ll ${objectiveLabel.toLowerCase()} using ${specialistNames}.`;

  return {
    prompt: text,
    goalInput,
    suggestedAgents: assigned,
    monitoringAgents: monitoring,
    summary,
    objectiveLabel,
  };
}
