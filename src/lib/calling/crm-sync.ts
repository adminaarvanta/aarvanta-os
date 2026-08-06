import { getCrmRepository } from "@/lib/data/crm-store";
import type { TenantScope } from "@/types/communication";
import type { CallSession } from "@/types/calling-agent";
import { contactDisplayName } from "@/types/crm";

/** Persist call outcome into CRM activities / contact fields. */
export async function syncCallOutcomeToCrm(
  session: CallSession,
  scope: TenantScope
) {
  if (!session.contactId) return;

  const crm = getCrmRepository();
  const contact = await crm.getContact(session.contactId, scope);
  if (!contact) return;

  const title = `Outgoing AI Call — ${contactDisplayName(contact)}`;
  const description = [
    session.summary,
    session.outcome ? `Outcome: ${session.outcome}` : null,
    session.sentiment ? `Sentiment: ${session.sentiment}` : null,
    session.callScore != null ? `Score: ${session.callScore}/5` : null,
    session.recordingUrl ? `Recording: ${session.recordingUrl}` : null,
    session.transcript.length
      ? `Transcript turns: ${session.transcript.length}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  await crm.createActivity(
    {
      type: "call",
      title,
      description,
      contactId: contact.id,
      accountId: contact.accountId,
      occurredAt: session.endedAt ?? session.startedAt,
      durationMinutes: session.durationSeconds
        ? Math.max(1, Math.round(session.durationSeconds / 60))
        : undefined,
      authorId: "voice-agent",
      authorName: "AI Voice Agent",
    },
    scope
  );

  const notes = [
    contact.notes,
    session.summary
      ? `[AI call ${session.endedAt?.slice(0, 10) ?? ""}] ${session.summary}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4000);

  await crm.updateContact(
    contact.id,
    {
      notes: notes || contact.notes,
    },
    scope
  );

  const crmUpdates = [
    ...(session.crmUpdates ?? []),
    "Created call activity",
    "Updated contact notes with AI summary",
  ];

  const { getCallingAgentRepository } = await import(
    "@/lib/data/calling-agent-store"
  );
  await getCallingAgentRepository().updateSession(
    session.id,
    { crmUpdates },
    scope
  );
}

export async function syncMeetingToCrm(input: {
  scope: TenantScope;
  contactId: string;
  meetingStart: string;
  meetingEnd: string;
  title: string;
  meetLink?: string;
  ownerId?: string;
  salesRepName?: string;
}) {
  const crm = getCrmRepository();
  const contact = await crm.getContact(input.contactId, input.scope);
  if (!contact) return;

  await crm.createActivity(
    {
      type: "meeting",
      title: input.title,
      description: [
        `Scheduled via AI calling agent`,
        input.meetLink ? `Meet: ${input.meetLink}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      contactId: contact.id,
      accountId: contact.accountId,
      occurredAt: input.meetingStart,
      durationMinutes: Math.max(
        1,
        Math.round(
          (new Date(input.meetingEnd).getTime() -
            new Date(input.meetingStart).getTime()) /
            60_000
        )
      ),
      authorId: "voice-agent",
      authorName: "AI Voice Agent",
    },
    input.scope
  );

  await crm.createTask(
    {
      title: `Meeting with ${contactDisplayName(contact)}`,
      description: [
        input.title,
        `When: ${input.meetingStart}`,
        input.meetLink ? `Link: ${input.meetLink}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      status: "todo",
      priority: "high",
      dueDate: input.meetingStart,
      contactId: contact.id,
      accountId: contact.accountId,
      assignedTo: input.ownerId,
      source: "ai",
      assignedAgentType: "voice",
    },
    input.scope
  );
}
