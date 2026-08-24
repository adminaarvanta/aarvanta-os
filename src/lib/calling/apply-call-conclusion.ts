import { inferCallConclusion, isFailedCallOutcome } from "@/lib/calling/call-conclusion";
import {
  sendCallScheduledEmail,
  sendCallSummaryEmail,
} from "@/lib/calling/call-loop-email";
import {
  createScheduledCall,
  getScheduledCall,
  updateScheduledCall,
} from "@/lib/calling/scheduled-call-store";
import {
  defaultSlotForCallback,
  resolveScheduleSlot,
  slotsFromSettings,
} from "@/lib/calling/schedule-slots";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import type { TenantScope } from "@/types/communication";
import {
  DEFAULT_RETRY_POLICY,
  VOICE_TASK_AGENT,
  type CallConclusion,
  type CallSession,
} from "@/types/calling-agent";
import type { ContactTag, CrmContact, CrmTask } from "@/types/crm";
import { contactDisplayName } from "@/types/crm";

function uniqueTags(tags: ContactTag[], extra: ContactTag[]): ContactTag[] {
  return [...new Set([...tags, ...extra])];
}

function shouldEmailClose(contact: CrmContact) {
  return contact.tags.some((t) => t === "customer" || t === "vip" || t === "partner");
}

async function completeTask(
  taskId: string | undefined,
  scope: TenantScope,
  note?: string
) {
  if (!taskId) return;
  const crm = getCrmRepository();
  const task = await crm.getTask(taskId, scope);
  if (!task || task.status === "done") return;
  const description = [task.description, note].filter(Boolean).join("\n");
  await crm.updateTask(
    taskId,
    { status: "done", ...(note ? { description } : {}) },
    scope
  );
}

export async function applyCallConclusion(
  session: CallSession,
  scope: TenantScope
): Promise<{ conclusion: CallConclusion; task?: CrmTask }> {
  if (!session.contactId) {
    return {
      conclusion: session.conclusion ?? {
        outcome: session.outcome ?? "completed",
        nextAction: "none",
      },
    };
  }

  const crm = getCrmRepository();
  const calling = getCallingAgentRepository();
  const contact = await crm.getContact(session.contactId, scope);
  if (!contact) {
    return {
      conclusion: session.conclusion ?? {
        outcome: session.outcome ?? "completed",
        nextAction: "none",
      },
    };
  }

  const settings = await getWorkspaceSettings(scope.workspaceId);
  const slotSettings = slotsFromSettings(settings);
  const campaign = session.campaignId
    ? await calling.getCampaign(session.campaignId, scope)
    : null;
  const slotOptions = {
    timeZone: campaign?.timezone || slotSettings.timeZone,
    morningHour: slotSettings.morningHour,
    afternoonHour: slotSettings.afternoonHour,
    workingHours: campaign?.workingHours,
    weekendCalling: campaign?.weekendCalling,
    enabledSlotIds: slotSettings.enabledSlotIds,
  };

  const conclusion = inferCallConclusion({
    outcome: session.conclusion?.outcome ?? session.outcome,
    summary: session.conclusion?.notes ?? session.summary,
    turns: session.transcript,
    nextAction: session.conclusion?.nextAction,
    promisedAt: session.conclusion?.promisedAt,
    slotId: session.conclusion?.slotId,
    infoToSend: session.conclusion?.infoToSend,
    notes: session.conclusion?.notes,
    slotOptions,
  });

  await calling.updateSession(session.id, { conclusion, outcome: conclusion.outcome }, scope);

  const originating = session.scheduledCallId
    ? await getScheduledCall(session.scheduledCallId, scope)
    : null;
  const originatingTaskId = session.crmTaskId ?? originating?.crmTaskId;

  if (isFailedCallOutcome(conclusion.outcome) && originating) {
    const attempts = (originating.attemptCount ?? 0) + 1;
    const max = DEFAULT_RETRY_POLICY.maxRetries;
    if (attempts < max && contact.phone) {
      const next = resolveScheduleSlot(
        defaultSlotForCallback(new Date(), slotOptions.timeZone),
        slotOptions
      );
      await updateScheduledCall(
        originating.id,
        {
          status: "scheduled",
          scheduledAt: next.at,
          attemptCount: attempts,
          error: conclusion.outcome,
          sessionId: session.id,
        },
        scope
      );
      if (originatingTaskId) {
        await crm.updateTask(
          originatingTaskId,
          { status: "todo", dueDate: next.at },
          scope
        );
      }
      await sendCallScheduledEmail({
        contact,
        scope,
        scheduledAt: next.at,
        timeZone: slotOptions.timeZone,
        kind: "missed",
      });
      return { conclusion };
    }

    await updateScheduledCall(
      originating.id,
      { status: "failed", error: conclusion.outcome, sessionId: session.id },
      scope
    );
    await completeTask(
      originatingTaskId,
      scope,
      `Closed after ${attempts} attempts (${conclusion.outcome}).`
    );
    return { conclusion };
  }

  if (originating?.status === "calling" || originating?.status === "scheduled") {
    await updateScheduledCall(
      originating.id,
      { status: "completed", sessionId: session.id },
      scope
    );
  }
  if (originatingTaskId && conclusion.nextAction !== "none") {
    await completeTask(
      originatingTaskId,
      scope,
      `Completed after call ${session.id}. Next: ${conclusion.nextAction}.`
    );
  } else {
    await completeTask(originatingTaskId, scope, `Completed after call ${session.id}.`);
  }

  if (conclusion.nextAction === "meeting") {
    return { conclusion };
  }

  if (conclusion.nextAction === "none") {
    if (shouldEmailClose(contact) && conclusion.notes) {
      await sendCallSummaryEmail({
        contact,
        scope,
        summary: conclusion.notes,
      });
    }
    return { conclusion };
  }

  const existingOpen = (await crm.listTasks(scope, { contactId: contact.id })).find(
    (t) =>
      t.callSessionId === session.id &&
      t.assignedAgentType === VOICE_TASK_AGENT &&
      t.status !== "done"
  );
  if (existingOpen) {
    return { conclusion, task: existingOpen };
  }

  if (conclusion.nextAction === "qualify_lead") {
    const score = Math.max(contact.leadScore ?? 0, 70);
    await crm.updateContact(
      contact.id,
      {
        tags: uniqueTags(contact.tags, ["hot_lead", "follow_up"]),
        leadScore: score,
        leadScoreReason: conclusion.notes || "Qualified on AI voice call",
        leadScoreUpdatedAt: new Date().toISOString(),
      },
      scope
    );
  } else if (conclusion.nextAction === "follow_up" || conclusion.nextAction === "callback") {
    await crm.updateContact(
      contact.id,
      { tags: uniqueTags(contact.tags, ["follow_up"]) },
      scope
    );
  }

  if (conclusion.nextAction === "send_info") {
    const task = await crm.createTask(
      {
        title: `Email promised info to ${contactDisplayName(contact)}`,
        description: [
          conclusion.infoToSend || "Send the information promised on the call.",
          conclusion.notes ? `Conclusion: ${conclusion.notes}` : null,
          `Session: ${session.id}`,
        ]
          .filter(Boolean)
          .join("\n"),
        status: "done",
        priority: "medium",
        contactId: contact.id,
        accountId: contact.accountId,
        source: "ai",
        assignedAgentType: VOICE_TASK_AGENT,
        voiceAgentId: session.voiceAgentId,
        callSessionId: session.id,
      },
      scope
    );
    await sendCallSummaryEmail({
      contact,
      scope,
      summary: conclusion.notes,
      infoToSend: conclusion.infoToSend || conclusion.notes,
    });
    return { conclusion, task };
  }

  const when = conclusion.promisedAt;
  const name = contactDisplayName(contact);
  const title =
    conclusion.nextAction === "callback"
      ? `Call back ${name}`
      : conclusion.nextAction === "qualify_lead"
        ? `Follow up as lead: ${name}`
        : `Follow up with ${name}`;

  let scheduledCallId: string | undefined;
  if (when && contact.phone) {
    const scheduled = await createScheduledCall(
      {
        phone: contact.phone,
        contactName: name,
        message: [
          conclusion.notes || "Follow-up AI voice call from prior conversation.",
          conclusion.infoToSend ? `Promised: ${conclusion.infoToSend}` : null,
        ]
          .filter(Boolean)
          .join(" "),
        scheduledAt: when,
        voiceAgentId: session.voiceAgentId,
        contactId: contact.id,
      },
      scope
    );
    scheduledCallId = scheduled.id;
  }

  const task = await crm.createTask(
    {
      title,
      description: [
        conclusion.notes,
        when ? `When: ${when}` : null,
        scheduledCallId ? `ScheduledCall: ${scheduledCallId}` : null,
        `Session: ${session.id}`,
        conclusion.infoToSend ? `Info: ${conclusion.infoToSend}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      status: "todo",
      priority: conclusion.nextAction === "qualify_lead" ? "high" : "medium",
      dueDate: when,
      contactId: contact.id,
      accountId: contact.accountId,
      source: "ai",
      assignedAgentType: VOICE_TASK_AGENT,
      voiceAgentId: session.voiceAgentId,
      callSessionId: session.id,
      scheduledCallId,
    },
    scope
  );

  if (scheduledCallId) {
    await updateScheduledCall(scheduledCallId, { crmTaskId: task.id }, scope);
  }

  if (when) {
    await sendCallScheduledEmail({
      contact,
      scope,
      scheduledAt: when,
      timeZone: slotOptions.timeZone,
      kind: "callback",
    });
  }
  await sendCallSummaryEmail({
    contact,
    scope,
    summary: conclusion.notes,
    infoToSend: conclusion.infoToSend,
    nextWhen: when,
    timeZone: slotOptions.timeZone,
  });

  const crmUpdates = [
    ...(session.crmUpdates ?? []),
    `Next action: ${conclusion.nextAction}`,
    task ? `Created AI voice task ${task.id}` : null,
    scheduledCallId ? `Scheduled follow-up ${scheduledCallId}` : null,
  ].filter((v): v is string => Boolean(v));
  await calling.updateSession(session.id, { crmUpdates }, scope);

  return { conclusion, task };
}
