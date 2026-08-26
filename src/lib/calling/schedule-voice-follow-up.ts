import { sendCallScheduledEmail } from "@/lib/calling/call-loop-email";
import {
  createScheduledCall,
  updateScheduledCall,
  type ScheduledCall,
} from "@/lib/calling/scheduled-call-store";
import { slotsFromSettings } from "@/lib/calling/schedule-slots";
import { normalizePhone } from "@/lib/data/conversation-helpers";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import type { TenantScope } from "@/types/communication";
import { VOICE_TASK_AGENT } from "@/types/calling-agent";
import type { CrmTask } from "@/types/crm";

export type ScheduleVoiceFollowUpInput = {
  phone?: string;
  contactId?: string;
  contactName?: string;
  message: string;
  scheduledAt: string;
  voiceAgentId?: string;
  kind?: "scheduled" | "callback" | "missed";
};

export async function scheduleVoiceFollowUp(
  input: ScheduleVoiceFollowUpInput,
  scope: TenantScope
): Promise<{ call: ScheduledCall; task: CrmTask }> {
  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Invalid scheduledAt");
  }
  if (scheduledAt.getTime() <= Date.now() + 60_000) {
    throw new Error("Schedule at least 1 minute in the future.");
  }

  const crm = getCrmRepository();
  let contact = input.contactId
    ? await crm.getContact(input.contactId, scope)
    : null;

  const phone = (input.phone ?? contact?.phone ?? "").trim();
  if (!phone) {
    throw new Error("Contact has no phone number for a voice call.");
  }

  if (!contact) {
    const normalized = normalizePhone(phone);
    const contacts = await crm.listContacts(scope);
    contact =
      contacts.find((c) => c.phone && normalizePhone(c.phone) === normalized) ??
      null;
  }

  const call = await createScheduledCall(
    {
      phone,
      contactName:
        input.contactName?.trim() ||
        (contact ? `${contact.firstName} ${contact.lastName}`.trim() : undefined),
      message: input.message.trim(),
      scheduledAt: scheduledAt.toISOString(),
      voiceAgentId: input.voiceAgentId?.trim() || undefined,
      contactId: contact?.id,
    },
    scope
  );

  const task = await crm.createTask(
    {
      title: `Scheduled call: ${call.contactName ?? call.phone}`,
      description: `Phone: ${call.phone}\nWhen: ${call.scheduledAt}\nMessage: ${call.message}`,
      priority: "high",
      dueDate: scheduledAt.toISOString(),
      contactId: contact?.id,
      accountId: contact?.accountId,
      source: "ai",
      assignedAgentType: VOICE_TASK_AGENT,
      voiceAgentId: call.voiceAgentId,
      scheduledCallId: call.id,
    },
    scope
  );
  await updateScheduledCall(call.id, { crmTaskId: task.id }, scope);

  if (contact) {
    const settings = await getWorkspaceSettings(scope.workspaceId);
    const { timeZone } = slotsFromSettings(settings);
    await sendCallScheduledEmail({
      contact,
      scope,
      scheduledAt: call.scheduledAt,
      timeZone,
      kind: input.kind ?? "scheduled",
    });
  }

  return { call, task };
}
