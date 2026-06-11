import { generateConversationInsights } from "@/lib/ai/insights";
import { shouldAutoSummarize } from "@/lib/ai/config";
import { getRepository } from "@/lib/data/repository";
import type { TenantScope } from "@/types/communication";

export async function refreshConversationAiInsights(
  conversationId: string,
  scope: TenantScope
): Promise<void> {
  const repo = getRepository();
  const conversation = await repo.getConversation(conversationId, scope);
  if (!conversation) return;

  const { summary, sentiment } =
    await generateConversationInsights(conversation);

  await repo.updateAiInsights(
    conversationId,
    { aiSummary: summary, sentiment },
    scope
  );
}

/** Fire-and-forget AI refresh after inbound events — does not block webhooks. */
export function scheduleAiInsightsRefresh(
  conversationId: string,
  scope: TenantScope
): void {
  if (!shouldAutoSummarize()) return;

  void refreshConversationAiInsights(conversationId, scope).catch((error) => {
    console.error(
      `[ai:auto-summarize] conversation=${conversationId}`,
      error instanceof Error ? error.message : error
    );
  });
}
