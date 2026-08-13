import { classifyIntent } from "@/lib/ai-team/intent";
import { buildHumanPlan, type HumanPlan } from "@/lib/ai-team/plan";
import { executeCommand } from "@/lib/ai-team/orchestrate";
import { getCrmRepository } from "@/lib/data/crm-store";
import type { CreateGoalInput } from "@/lib/workforce/pipeline/goal-engine";
import { contactDisplayName } from "@/types/crm";
import type { TenantScope } from "@/types/communication";
import type { BusinessModuleHint } from "@/types/workforce";
import type { AiTeamModule } from "@/lib/ai-team/modules";

export type { AiTeamModule } from "@/lib/ai-team/modules";
export { ASK_AI_SUGGESTIONS } from "@/lib/ai-team/modules";

export type ContextCommandInput = {
  module: AiTeamModule;
  entityType?: string;
  entityId?: string;
  prompt: string;
};

async function resolveRelatedIds(
  scope: TenantScope,
  input: ContextCommandInput
): Promise<{
  relatedContactId?: string;
  relatedDealId?: string;
  contextNote?: string;
  moduleHint?: BusinessModuleHint;
}> {
  const crm = getCrmRepository();
  const moduleHint = moduleToHint(input.module);

  if (input.module === "crm" && input.entityType === "contact" && input.entityId) {
    const contact = await crm.getContact(input.entityId, scope);
    if (!contact) return { moduleHint };
    return {
      relatedContactId: contact.id,
      moduleHint: "crm",
      contextNote: `Context: CRM contact ${contactDisplayName(contact)}${
        contact.email ? ` (${contact.email})` : ""
      }${contact.leadScore != null ? `; lead score ${contact.leadScore}` : ""}.`,
    };
  }

  if (input.module === "crm" && input.entityType === "deal" && input.entityId) {
    const deal = await crm.getDeal(input.entityId, scope);
    if (!deal) return { moduleHint };
    const contact = deal.contactId
      ? await crm.getContact(deal.contactId, scope)
      : null;
    return {
      relatedDealId: deal.id,
      relatedContactId: deal.contactId,
      moduleHint: "crm",
      contextNote: `Context: CRM deal “${deal.title}” worth ${deal.currency} ${deal.value}${
        contact ? `; contact ${contactDisplayName(contact)}` : ""
      }.`,
    };
  }

  return { moduleHint };
}

function moduleToHint(module: AiTeamModule): BusinessModuleHint {
  switch (module) {
    case "crm":
      return "crm";
    case "hr":
      return "hr";
    case "marketing":
      return "marketing";
    case "finance":
      return "finance";
    case "knowledge":
    case "build":
    case "operations":
    default:
      return "operations";
  }
}

/** Plan a job with module/entity context attached to instructions. */
export async function planContextCommand(
  scope: TenantScope,
  input: ContextCommandInput
): Promise<{ plan: HumanPlan }> {
  const related = await resolveRelatedIds(scope, input);
  const intent = classifyIntent(input.prompt, {
    relatedContactId: related.relatedContactId,
    relatedDealId: related.relatedDealId,
  });

  const promptText = input.prompt.trim();
  const goalInput: CreateGoalInput = {
    ...intent.goalInput,
    moduleHint: intent.goalInput.moduleHint ?? related.moduleHint,
    relatedContactId:
      intent.goalInput.relatedContactId ?? related.relatedContactId,
    relatedDealId: intent.goalInput.relatedDealId ?? related.relatedDealId,
    // intent.goalInput.instructions already includes the user prompt for RAG;
    // prepend page/entity context when present.
    instructions: [related.contextNote, intent.goalInput.instructions]
      .filter(Boolean)
      .join("\n"),
  };

  if (goalInput.objective === "custom" && !goalInput.customObjective?.trim()) {
    goalInput.customObjective = promptText;
  }

  const plan = buildHumanPlan({
    ...intent,
    goalInput,
    summary: related.contextNote
      ? `${intent.summary} Using page context.`
      : intent.summary,
  });

  return { plan: { ...plan, goalInput } };
}

export async function executeContextCommand(
  scope: TenantScope,
  goalInput: CreateGoalInput
) {
  return executeCommand(scope, goalInput);
}
