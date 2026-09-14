import { getEmailFromAddress } from "@/lib/channels/gmail-client";
import { deliverOutbound } from "@/lib/channels/deliver";
import { isDemoMode } from "@/lib/config/app-mode";
import type { TenantScope } from "@/types/communication";
import type { MeetingBooking } from "@/types/calling-agent";
import type { CrmContact } from "@/types/crm";
import { contactDisplayName } from "@/types/crm";

function icsUtc(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function icsEscape(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function uniqueMailboxes(emails: Array<string | undefined>) {
  return [
    ...new Set(
      emails
        .map((email) => email?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email && email.includes("@")))
    ),
  ];
}

/** METHOD:REQUEST invite Google Calendar can auto-add without OAuth. */
export function buildMeetingInviteIcs(
  meeting: MeetingBooking,
  contact: CrmContact,
  attendees: string[]
) {
  const uid = `${meeting.id}@aarvanta.co`;
  const organizer = getEmailFromAddress();
  const mailboxes = uniqueMailboxes(attendees);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aarvanta//Calling Agent//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsUtc(new Date().toISOString())}`,
    `DTSTART:${icsUtc(meeting.meetingStart)}`,
    `DTEND:${icsUtc(meeting.meetingEnd)}`,
    `SUMMARY:${icsEscape(meeting.title)}`,
    `DESCRIPTION:${icsEscape(
      `Discovery call with ${contactDisplayName(contact)}${
        meeting.meetLink ? `\n${meeting.meetLink}` : ""
      }`
    )}`,
    meeting.meetLink ? `URL:${meeting.meetLink}` : "",
    `ORGANIZER;CN=Aarvanta:mailto:${organizer}`,
    ...mailboxes.map(
      (email) =>
        `ATTENDEE;CN=${icsEscape(email)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${email}`
    ),
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export async function sendMeetingConfirmationEmail(
  meeting: MeetingBooking,
  contact: CrmContact,
  _scope: TenantScope,
  opts?: { reschedule?: boolean; reminder?: boolean; extraEmails?: string[] }
) {
  const recipients = uniqueMailboxes([contact.email, ...(opts?.extraEmails ?? [])]);
  if (recipients.length === 0) return;

  const when = new Date(meeting.meetingStart).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: meeting.timezone,
  });

  const subject = opts?.reminder
    ? `Reminder: ${meeting.title}`
    : opts?.reschedule
      ? `Meeting Rescheduled: ${meeting.title}`
      : `Meeting Confirmed: ${meeting.title}`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  const text = [
    `Hi ${contact.firstName},`,
    "",
    opts?.reminder
      ? "This is a reminder for your upcoming meeting."
      : opts?.reschedule
        ? "Your meeting has been rescheduled."
        : "Your meeting is confirmed.",
    "",
    `When: ${when} (${meeting.timezone})`,
    `Duration: ${meeting.durationMinutes} minutes`,
    meeting.salesRepName ? `With: ${meeting.salesRepName}` : null,
    meeting.meetLink ? `Join: ${meeting.meetLink}` : null,
    "",
    appUrl
      ? `Reschedule: ${appUrl}/voice/meetings/${meeting.id}`
      : null,
    "",
    "— Aarvanta",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const ics = buildMeetingInviteIcs(meeting, contact, recipients);

  if (isDemoMode()) {
    console.info("[meeting-email:demo]", { to: recipients, subject });
    return;
  }

  for (const email of recipients) {
    await deliverOutbound({
      channel: "email",
      contact: {
        id: contact.id,
        name: contactDisplayName(contact),
        email,
        phone: contact.phone,
      },
      subject,
      content: text,
      icalEvent: {
        filename: "invite.ics",
        method: "REQUEST",
        content: ics,
      },
    });
  }
}
