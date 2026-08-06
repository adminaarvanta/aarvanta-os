import { deliverOutbound } from "@/lib/channels/deliver";
import { isDemoMode } from "@/lib/config/app-mode";
import type { TenantScope } from "@/types/communication";
import type { MeetingBooking } from "@/types/calling-agent";
import type { CrmContact } from "@/types/crm";
import { contactDisplayName } from "@/types/crm";

function buildIcs(meeting: MeetingBooking, contact: CrmContact) {
  const uid = `${meeting.id}@aarvanta.co`;
  const dt = (iso: string) =>
    iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aarvanta//Calling Agent//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dt(new Date().toISOString())}`,
    `DTSTART:${dt(meeting.meetingStart)}`,
    `DTEND:${dt(meeting.meetingEnd)}`,
    `SUMMARY:${meeting.title}`,
    `DESCRIPTION:Discovery call with ${contactDisplayName(contact)}${
      meeting.meetLink ? `\\n${meeting.meetLink}` : ""
    }`,
    meeting.meetLink ? `URL:${meeting.meetLink}` : "",
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
  opts?: { reschedule?: boolean; reminder?: boolean }
) {
  if (!contact.email) return;

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

  const ics = buildIcs(meeting, contact);

  if (isDemoMode()) {
    console.info("[meeting-email:demo]", { to: contact.email, subject });
    return;
  }

  await deliverOutbound({
    channel: "email",
    contact: {
      id: contact.id,
      name: contactDisplayName(contact),
      email: contact.email,
      phone: contact.phone,
    },
    subject,
    content: `${text}\n\n---\nCalendar invite (.ics):\n${ics}`,
  });
}
