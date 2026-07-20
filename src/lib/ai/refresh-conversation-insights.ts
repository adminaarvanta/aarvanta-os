import { generateConversationInsights } from "@/lib/ai/insights";
import { shouldProcessInboundAi } from "@/lib/ai/config";
import { getWorkspaceSettingsSync } from "@/lib/settings/workspace-settings";
import {
  qualifyAndCreateCrmLead,
  syncInboundToExistingCrmContact,
} from "@/lib/data/inbound-crm-bridge";
import { scheduleHrCaseEvaluation } from "@/lib/hr/evaluate-conversation-case";
import { detectConversationIdentity } from "@/lib/identity/detect-entity-type";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import type { TenantScope } from "@/types/communication";

async function refreshConversationIdentity(
  conversationId: string,
  scope: TenantScope
): Promise<void> {
  const repo = getRepository();
  const conversation = await repo.getConversation(conversationId, scope);
  if (!conversation) return;

  const crm = getCrmRepository();
  const [contacts, companies] = await Promise.all([
    crm.listContacts(scope),
    crm.listCompanies(scope),
  ]);

  const identity = detectConversationIdentity(conversation, {
    contacts,
    companies,
  });
  await repo.updateIdentity(conversationId, identity, scope);
}

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
  await refreshConversationIdentity(conversationId, scope);
  scheduleHrCaseEvaluation(conversationId, scope);
}

function shouldRunAiInsights(scope: TenantScope): boolean {
  return (
    getWorkspaceSettingsSync(scope.workspaceId).aiAutoSummarize &&
    shouldProcessInboundAi()
  );
}

/** Runs after every inbound message — AI insights optional, HR automation always eligible. */
export function schedulePostInboundAutomation(
  conversationId: string,
  scope: TenantScope
): void {
  if (shouldRunAiInsights(scope)) {
    void refreshConversationAiInsights(conversationId, scope).catch((error) => {
      console.error(
        `[ai:inbound-processing] conversation=${conversationId}`,
        error instanceof Error ? error.message : error
      );
    });
    return;
  }

  void (async () => {
    try {
      const conversation = await getRepository().getConversation(conversationId, scope);
      if (!conversation) return;
      await syncInboundToExistingCrmContact(conversation, scope);
      await refreshConversationIdentity(conversationId, scope);
      scheduleHrCaseEvaluation(conversationId, scope);
    } catch (error) {
      console.error(
        `[hr:inbound-processing] conversation=${conversationId}`,
        error instanceof Error ? error.message : error
      );
    }
  })();
}

/** @deprecated Use schedulePostInboundAutomation */
export function scheduleAiInsightsRefresh(
  conversationId: string,
  scope: TenantScope
): void {
  schedulePostInboundAutomation(conversationId, scope);
}

export { syncInboundToExistingCrmContact };
