import { getWorkforceContextsStore } from "@/lib/data/workforce-pipeline-store";
import { buildWorkforceContext } from "@/lib/workforce/context";
import type { TenantScope } from "@/types/communication";
import type { ContextPackage, WorkforceGoal } from "@/types/workforce";

function summarizeContext(
  fields: Awaited<ReturnType<typeof buildWorkforceContext>>
): string {
  const parts: string[] = [];
  if (fields.contact) {
    parts.push(
      `Customer: ${fields.contact.name}` +
        (fields.contact.company ? ` (${fields.contact.company})` : "") +
        (fields.contact.leadScore != null
          ? ` · Lead score ${fields.contact.leadScore}`
          : "")
    );
  }
  if (fields.deal) {
    parts.push(
      `Deal: ${fields.deal.title} · ${fields.deal.currency} ${fields.deal.value} · ${fields.deal.stageName ?? fields.deal.status}`
    );
  }
  if (fields.conversation) {
    parts.push(
      `Thread: ${fields.conversation.contactName} · ${fields.conversation.sentiment ?? "neutral"}`
    );
  }
  parts.push(
    `Business: ${fields.business.openDealCount} open deals · ${fields.business.openTaskCount} open tasks · ${fields.business.hotLeadCount} hot leads`
  );
  return parts.join(" | ");
}

/** Context Builder — merges CRM/inbox/HR signals into one package. */
export async function buildContextPackage(
  goal: WorkforceGoal,
  scope: TenantScope
): Promise<ContextPackage> {
  const fields = await buildWorkforceContext(scope, {
    contactId: goal.relatedContactId,
    conversationId: goal.relatedConversationId,
  });

  const pkg: Omit<ContextPackage, "id"> & { id?: string } = {
    ...scope,
    goalId: goal.id,
    contactId: goal.relatedContactId ?? fields.contact?.id,
    dealId: goal.relatedDealId ?? fields.deal?.id,
    conversationId: goal.relatedConversationId ?? fields.conversation?.id,
    summary: summarizeContext(fields),
    fields: fields as unknown as Record<string, unknown>,
    createdAt: new Date().toISOString(),
  };

  return getWorkforceContextsStore().create(pkg);
}
