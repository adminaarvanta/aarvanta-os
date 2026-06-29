import { generateConversationInsights } from "@/lib/ai/insights";
import { shouldProcessInboundAi } from "@/lib/ai/config";
import {
  qualifyAndCreateCrmLead,
  syncInboundToExistingCrmContact,
} from "@/lib/data/inbound-crm-bridge";
import { scheduleHrCaseEvaluation } from "@/lib/hr/evaluate-conversation-case";
import { getRepository } from "@/lib/data/repository";
import type { TenantScope } from "@/types/communication";

export async function refreshConversationAiInsights(
  conversationId: string,
  scope: TenantScope
): Promise<void> {
  const repo = getRepository();
  const conversation = await repo.getConversation(conversationId, scope);
  if (!conversation) return;

  const insights = await generateConversationInsights(conversation);

  await repo.updateAiInsights(
    conversationId,
    {
      aiSummary: insights.summary,
      sentiment: insights.sentiment,
      aiIntent: insights.intent,
      aiQualificationScore: insights.qualificationScore,
    },
    scope
  );

  const updated = await repo.getConversation(conversationId, scope);
  if (!updated) return;

  await qualifyAndCreateCrmLead(updated, scope, {
    intent: insights.intent,
    qualificationScore: insights.qualificationScore,
  });

  await syncInboundToExistingCrmContact(updated, scope);
  scheduleHrCaseEvaluation(conversationId, scope);
}

/** Fire-and-forget AI + CRM qualification after inbound — does not block webhooks. */
export function scheduleAiInsightsRefresh(
  conversationId: string,
  scope: TenantScope
): void {
  if (!shouldProcessInboundAi()) return;

  void refreshConversationAiInsights(conversationId, scope).catch((error) => {
    console.error(
      `[ai:inbound-processing] conversation=${conversationId}`,
      error instanceof Error ? error.message : error
    );
  });
}

export { syncInboundToExistingCrmContact };
