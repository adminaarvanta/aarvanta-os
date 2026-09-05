import { closeCallSession } from "@/lib/calling/close-call-session";
import { deliverOutbound } from "@/lib/channels/deliver";
import { shouldSimulateChannel } from "@/lib/channels/config";
import { buildCallMemorySummary } from "@/lib/calling/call-memory";
import { resolveCallVoiceAgent } from "@/lib/calling/resolve-voice-agent";
import {
  createScheduledCall,
  getScheduledCall,
  listDueScheduledCalls,
  updateScheduledCall,
  type ScheduledCall,
} from "@/lib/calling/scheduled-call-store";
import { normalizePhone } from "@/lib/data/conversation-helpers";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import { crmNow } from "@/lib/data/crm-helpers";
import { getWebhookTenantScope } from "@/lib/tenant/context";
import { VOICE_TASK_AGENT } from "@/types/calling-agent";
import { contactDisplayName, type CrmTask } from "@/types/crm";
import type { TenantScope } from "@/types/communication";

export type PlaceCallResult = { id: string; ok: boolean; error?: string };

export async function placeScheduledCall(
  item: ScheduledCall
): Promise<PlaceCallResult> {
  const scope: TenantScope = {
    tenantId: item.tenantId,
    workspaceId: item.workspaceId,
    companyId: item.companyId,
  };
  let sessionId: string | undefined;
  try {
    const repo = getRepository();
    const calling = getCallingAgentRepository();
    const crm = getCrmRepository();

    let conversation = await repo.findConversationByPhone(item.phone, scope);
    if (!conversation) {
      conversation = await repo.addInboundCall(
        {
          phone: item.phone,
          contactName: item.contactName ?? item.phone,
          durationSeconds: 0,
          summary: "Scheduled outbound call",
        },
        scope
      );
    }

    const normalized = normalizePhone(item.phone);
    let crmContact = item.contactId
      ? await crm.getContact(item.contactId, scope)
      : null;
    if (!crmContact) {
      const contacts = await crm.listContacts(scope);
      crmContact =
        contacts.find((c) => c.phone && normalizePhone(c.phone) === normalized) ??
        null;
    }
    const agent = await resolveCallVoiceAgent(scope, {
      voiceAgentId: item.voiceAgentId,
    });
    const memorySummary = crmContact
      ? await buildCallMemorySummary(crmContact.id, scope)
      : undefined;

    const session = await calling.createSession(
      {
        contactId: crmContact?.id,
        voiceAgentId: agent?.id,
        conversationId: conversation.id,
        scheduledCallId: item.id,
        crmTaskId: item.crmTaskId,
        status: "ringing",
        memorySummary,
      },
      scope
    );
    sessionId = session.id;

    if (item.crmTaskId) {
      await crm.updateTask(
        item.crmTaskId,
        { status: "in_progress", callSessionId: session.id },
        scope
      );
    }

    let delivery;
    try {
      delivery = await deliverOutbound({
        channel: "voice",
        contact: {
          ...conversation.contact,
          phone: conversation.contact.phone ?? item.phone,
          name:
            item.contactName ??
            (crmContact
              ? contactDisplayName(crmContact)
              : conversation.contact.name),
        },
        content: item.message,
        conversationId: conversation.id,
        voiceDirection: "outbound",
        contactId: crmContact?.id,
        sessionId: session.id,
        voiceAgentId: agent?.id,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Twilio voice delivery failed";
      await closeCallSession({
        scope,
        sessionId: session.id,
        outcome: "failed",
        summary: message,
        applySideEffects: false,
      });
      throw error;
    }

    await calling.updateSession(
      session.id,
      {
        status: shouldSimulateChannel("voice") ? "in_progress" : "ringing",
        callSid: delivery.callSid,
        summary: item.message,
      },
      scope
    );

    await repo.addOutboundCall(
      conversation.id,
      {
        summary: `[Scheduled] ${item.message}`,
        callSid: delivery.callSid,
        durationSeconds: 0,
      },
      scope,
      { name: "Scheduler", id: "system" }
    );

    await updateScheduledCall(
      item.id,
      {
        status: "calling",
        conversationId: conversation.id,
        sessionId: session.id,
        contactId: crmContact?.id ?? item.contactId,
      },
      scope
    );
    return { id: item.id, ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    await updateScheduledCall(
      item.id,
      { status: "failed", error: message },
      scope
    );
    if (sessionId) {
      await closeCallSession({
        scope,
        sessionId,
        outcome: "failed",
        summary: message,
        applySideEffects: false,
      });
    }
    return { id: item.id, ok: false, error: message };
  }
}

async function ensureScheduledCallForDueTask(
  task: CrmTask,
  scope: TenantScope
): Promise<ScheduledCall | null> {
  const crm = getCrmRepository();
  if (task.scheduledCallId) {
  const existing = await getScheduledCall(task.scheduledCallId, scope);
    if (existing?.status === "scheduled") return existing;
    if (existing?.status === "calling" || existing?.status === "completed") {
      return null;
    }
  }

  if (!task.contactId) return null;
  const contact = await crm.getContact(task.contactId, scope);
  if (!contact?.phone) return null;

  const scheduled = await createScheduledCall(
    {
      phone: contact.phone,
      contactName: contactDisplayName(contact),
      message: task.description || task.title,
      scheduledAt: task.dueDate || crmNow(),
      voiceAgentId: task.voiceAgentId,
      contactId: contact.id,
      crmTaskId: task.id,
    },
    scope
  );
  await crm.updateTask(task.id, { scheduledCallId: scheduled.id }, scope);
  return scheduled;
}

/** Place due scheduled calls and due AI voice CRM tasks. */
export async function runScheduledCallExecutor(): Promise<PlaceCallResult[]> {
  const due = await listDueScheduledCalls(crmNow());
  const results: PlaceCallResult[] = [];
  const seen = new Set(due.map((item) => item.id));

  for (const item of due) {
    results.push(await placeScheduledCall(item));
  }

  const fallbackScope = getWebhookTenantScope();
  const crm = getCrmRepository();
  const tasks = await crm.listTasks(fallbackScope, {
    assignedAgentType: VOICE_TASK_AGENT,
  });
  const now = Date.now();
  for (const task of tasks) {
    if (task.status === "done") continue;
    if (!task.dueDate) continue;
    if (new Date(task.dueDate).getTime() > now) continue;
    if (task.scheduledCallId && seen.has(task.scheduledCallId)) continue;
    const scheduled = await ensureScheduledCallForDueTask(task, fallbackScope);
    if (!scheduled || seen.has(scheduled.id)) continue;
    seen.add(scheduled.id);
    results.push(await placeScheduledCall(scheduled));
  }

  return results;
}
