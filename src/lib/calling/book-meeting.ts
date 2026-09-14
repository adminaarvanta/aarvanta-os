import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  hasLiveGoogleCalendar,
  looksLikeCalendarMailbox,
  updateGoogleCalendarEvent,
} from "@/lib/calendar/google-calendar";
import { getUserCalendarConnection } from "@/lib/calendar/user-calendar";
import { syncMeetingToCrm } from "@/lib/calling/crm-sync";
import { scheduleMeetingReminders } from "@/lib/calling/reminders";
import { sendMeetingConfirmationEmail } from "@/lib/calling/meeting-email";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { isDemoMode } from "@/lib/config/app-mode";
import type { TenantScope } from "@/types/communication";
import { contactDisplayName } from "@/types/crm";

export async function bookMeeting(input: {
  scope: TenantScope;
  leadId: string;
  meetingStart: string;
  meetingEnd: string;
  timezone: string;
  campaignId?: string;
  sessionId?: string;
  ownerId?: string;
  salesRepName?: string;
}) {
  const crm = getCrmRepository();
  const contact = await crm.getContact(input.leadId, input.scope);
  if (!contact) throw new Error("Contact not found");

  const company = contact.accountId
    ? await crm.getCompany(contact.accountId, input.scope)
    : null;
  const title = `Discovery Call — ${company?.name ?? contactDisplayName(contact)}`;
  const durationMinutes = Math.max(
    1,
    Math.round(
      (new Date(input.meetingEnd).getTime() -
        new Date(input.meetingStart).getTime()) /
        60_000
    )
  );

  let calendarEventId: string | undefined;
  let meetLink: string | undefined;

  if (
    !isDemoMode() &&
    (await hasLiveGoogleCalendar(input.scope, input.ownerId))
  ) {
    try {
      const event = await createGoogleCalendarEvent(
        input.scope,
        {
          title,
          description: "Booked by Aarvanta AI calling agent",
          start: input.meetingStart,
          end: input.meetingEnd,
          timezone: input.timezone,
          attendeeEmail: contact.email,
        },
        input.ownerId
      );
      calendarEventId = event.eventId;
      meetLink = event.meetLink;
    } catch (error) {
      console.warn("[book-meeting] Google event create failed", error);
    }
  }
  if (!calendarEventId) {
    calendarEventId = `local_${Date.now()}`;
    meetLink = isDemoMode()
      ? "https://meet.google.com/aar-vanta-demo"
      : fallbackMeetLink();
  }

  const meeting = await getCallingAgentRepository().createMeeting(
    {
      leadId: input.leadId,
      campaignId: input.campaignId,
      sessionId: input.sessionId,
      calendarEventId,
      ownerId: input.ownerId,
      title,
      meetingStart: input.meetingStart,
      meetingEnd: input.meetingEnd,
      timezone: input.timezone,
      durationMinutes,
      meetLink,
      salesRepName: input.salesRepName ?? "Sales Specialist",
      status: "scheduled",
    },
    input.scope
  );

  if (input.sessionId) {
    await getCallingAgentRepository().updateSession(
      input.sessionId,
      {
        outcome: "meeting_booked",
        status: "completed",
        currentStage: "end_call",
      },
      input.scope
    );
  }

  const sessions = await getCallingAgentRepository().listSessions(input.scope, {
    contactId: input.leadId,
  });
  const live = sessions.find((s) => s.queueId && s.status !== "completed");
  if (live?.queueId) {
    await getCallingAgentRepository().updateQueueItem(
      live.queueId,
      { status: "booked_meeting", lastOutcome: "meeting_booked" },
      input.scope
    );
  }

  await syncMeetingToCrm({
    scope: input.scope,
    contactId: input.leadId,
    meetingStart: input.meetingStart,
    meetingEnd: input.meetingEnd,
    title,
    meetLink,
    ownerId: input.ownerId,
    salesRepName: input.salesRepName,
  });

  await scheduleMeetingReminders(meeting, input.scope);

  try {
    await sendMeetingConfirmationEmail(meeting, contact, input.scope, {
      extraEmails: await calendarInviteEmails(input.scope, input.ownerId, contact.email),
    });
  } catch (err) {
    console.warn("[book-meeting] confirmation email failed", err);
  }

  return meeting;
}

export async function rescheduleMeeting(input: {
  scope: TenantScope;
  meetingId: string;
  meetingStart: string;
  meetingEnd: string;
  timezone?: string;
}) {
  const repo = getCallingAgentRepository();
  const existing = await repo.getMeeting(input.meetingId, input.scope);
  if (!existing) throw new Error("Meeting not found");

  const timezone = input.timezone ?? existing.timezone;
  if (
    existing.calendarEventId &&
    !existing.calendarEventId.startsWith("local_") &&
    (await hasLiveGoogleCalendar(input.scope, existing.ownerId))
  ) {
    try {
      await updateGoogleCalendarEvent(
        input.scope,
        existing.calendarEventId,
        {
          start: input.meetingStart,
          end: input.meetingEnd,
          timezone,
          title: existing.title,
        },
        existing.ownerId
      );
    } catch (error) {
      console.warn("[book-meeting] Google event update failed", error);
    }
  }

  const updated = await repo.updateMeeting(
    input.meetingId,
    {
      meetingStart: input.meetingStart,
      meetingEnd: input.meetingEnd,
      timezone,
      status: "rescheduled",
      durationMinutes: Math.max(
        1,
        Math.round(
          (new Date(input.meetingEnd).getTime() -
            new Date(input.meetingStart).getTime()) /
            60_000
        )
      ),
    },
    input.scope
  );

  if (updated) {
    await scheduleMeetingReminders(updated, input.scope, { replace: true });
    const contact = await getCrmRepository().getContact(updated.leadId, input.scope);
    if (contact) {
      try {
        await sendMeetingConfirmationEmail(updated, contact, input.scope, {
          reschedule: true,
          extraEmails: await calendarInviteEmails(
            input.scope,
            existing.ownerId,
            contact.email
          ),
        });
      } catch {
        /* ignore */
      }
    }
  }

  return updated;
}

export async function cancelMeeting(input: {
  scope: TenantScope;
  meetingId: string;
}) {
  const repo = getCallingAgentRepository();
  const existing = await repo.getMeeting(input.meetingId, input.scope);
  if (!existing) throw new Error("Meeting not found");

  if (
    existing.calendarEventId &&
    !existing.calendarEventId.startsWith("local_") &&
    (await hasLiveGoogleCalendar(input.scope, existing.ownerId))
  ) {
    try {
      await deleteGoogleCalendarEvent(
        input.scope,
        existing.calendarEventId,
        existing.ownerId
      );
    } catch (error) {
      console.warn("[book-meeting] Google event delete failed", error);
    }
  }

  const reminders = await repo.listReminders(input.scope, {
    meetingBookingId: existing.id,
  });
  for (const r of reminders) {
    if (r.status === "pending") {
      await repo.updateReminder(r.id, { status: "cancelled" }, input.scope);
    }
  }

  return repo.updateMeeting(input.meetingId, { status: "cancelled" }, input.scope);
}

function fallbackMeetLink() {
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `https://meet.jit.si/aarvanta-${id}`;
}

async function calendarInviteEmails(
  scope: TenantScope,
  ownerId: string | undefined,
  contactEmail?: string
): Promise<string[]> {
  const conn = await getUserCalendarConnection(scope, ownerId);
  const ownerEmail = (conn?.metadata?.email || conn?.accountLabel || "").trim();
  if (!looksLikeCalendarMailbox(ownerEmail)) {
    return [];
  }
  if (contactEmail && ownerEmail.toLowerCase() === contactEmail.toLowerCase()) {
    return [];
  }
  return [ownerEmail];
}
