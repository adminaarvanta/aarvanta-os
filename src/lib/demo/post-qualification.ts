import { getCrmRepository } from "@/lib/data/crm-store";
import { getNotificationsRepository } from "@/lib/data/notifications-store";
import { executeAgentRun } from "@/lib/workforce/run-agent";
import { buildWorkforceContext } from "@/lib/workforce/context";
import { contactDisplayName } from "@/types/crm";
import type { TenantScope } from "@/types/communication";
import type { CrmContact } from "@/types/crm";

/** After a lead is qualified — notify human closer and run marketing nurture. */
export async function runPostQualificationAutomation(
  scope: TenantScope,
  contact: CrmContact,
  options?: { conversationId?: string }
) {
  const crm = getCrmRepository();
  const notifications = getNotificationsRepository();
  const name = contactDisplayName(contact);

  await notifications.createNotification(
    {
      kind: "alert",
      priority: "high",
      title: `Hot lead ready to close: ${name}`,
      body: `AI Sales Manager qualified this inbound lead. Review CRM and book a closing call.`,
      actionUrl: `/crm/contacts/${contact.id}`,
      source: "ai_sales_manager",
    },
    scope
  );

  const workforceContext = await buildWorkforceContext(scope, {
    contactId: contact.id,
    conversationId: options?.conversationId,
  });

  const marketingRun = await executeAgentRun({
    agentType: "marketing_manager",
    context: workforceContext,
  });

  await crm.createActivity(
    {
      type: "note",
      title: "Marketing nurture sequence started",
      description: marketingRun.summary,
      contactId: contact.id,
      authorName: "AI Marketing Manager",
    },
    scope
  );

  await crm.createTask(
    {
      title: `Send nurture email: ${name}`,
      description:
        "AI Marketing Manager drafted a follow-up nurture sequence. Personalise and send within 24 hours.",
      contactId: contact.id,
      priority: "medium",
      assignedAgentType: "marketing_manager",
      source: "ai",
    },
    scope
  );

  return { marketingSummary: marketingRun.summary };
}
