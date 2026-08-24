import { deliverOutbound } from "@/lib/channels/deliver";
import { isDemoMode } from "@/lib/config/app-mode";
import { getCrmRepository } from "@/lib/data/crm-store";
import type { TenantScope } from "@/types/communication";
import type { CrmContact } from "@/types/crm";
import { contactDisplayName } from "@/types/crm";
import { formatWhen } from "@/lib/calling/schedule-slots";

async function logEmailActivity(
  contact: CrmContact,
  scope: TenantScope,
  title: string,
  description: string
) {
  await getCrmRepository().createActivity(
    {
      type: "note",
      title,
      description,
      contactId: contact.id,
      accountId: contact.accountId,
      authorId: "voice-agent",
      authorName: "AI Voice Agent",
    },
    scope
  );
}

async function sendCustomerEmail(input: {
  contact: CrmContact;
  scope: TenantScope;
  subject: string;
  text: string;
  activityTitle: string;
}) {
  if (!input.contact.email) {
    await logEmailActivity(
      input.contact,
      input.scope,
      "Could not email customer",
      `${input.activityTitle} — no email address on this person.`
    );
    return { sent: false as const, reason: "no_email" };
  }

  if (isDemoMode()) {
    console.info("[call-loop-email:demo]", {
      to: input.contact.email,
      subject: input.subject,
    });
    await logEmailActivity(
      input.contact,
      input.scope,
      input.activityTitle,
      `Demo log → ${input.contact.email}\n${input.subject}\n\n${input.text}`
    );
    return { sent: true as const, demo: true };
  }

  await deliverOutbound({
    channel: "email",
    contact: {
      id: input.contact.id,
      name: contactDisplayName(input.contact),
      email: input.contact.email,
      phone: input.contact.phone,
    },
    subject: input.subject,
    content: input.text,
  });

  await logEmailActivity(
    input.contact,
    input.scope,
    input.activityTitle,
    `Sent to ${input.contact.email}\n${input.subject}\n\n${input.text}`
  );
  return { sent: true as const, demo: false };
}

function signOff() {
  return "— Aarvanta";
}

export async function sendCallScheduledEmail(input: {
  contact: CrmContact;
  scope: TenantScope;
  scheduledAt: string;
  timeZone: string;
  kind?: "scheduled" | "callback" | "missed";
}) {
  const when = formatWhen(input.scheduledAt, input.timeZone);
  const kind = input.kind ?? "scheduled";
  const subject =
    kind === "missed"
      ? `We missed you — next call ${when}`
      : kind === "callback"
        ? `Your callback is set for ${when}`
        : `Your call is scheduled for ${when}`;
  const intro =
    kind === "missed"
      ? "We tried reaching you and couldn't connect. We'll try again at the time below."
      : kind === "callback"
        ? "As discussed on our call, we've scheduled a follow-up."
        : "Your call with our team is scheduled.";

  return sendCustomerEmail({
    contact: input.contact,
    scope: input.scope,
    subject,
    activityTitle:
      kind === "missed"
        ? "Emailed missed-call retry"
        : kind === "callback"
          ? "Emailed callback confirmation"
          : "Emailed call schedule",
    text: [
      `Hi ${input.contact.firstName},`,
      "",
      intro,
      "",
      `When: ${when} (${input.timeZone})`,
      "",
      "If you need a different time, just reply to this email.",
      "",
      signOff(),
    ].join("\n"),
  });
}

export async function sendCallSummaryEmail(input: {
  contact: CrmContact;
  scope: TenantScope;
  summary?: string;
  infoToSend?: string;
  nextWhen?: string;
  timeZone?: string;
}) {
  const whenLine =
    input.nextWhen && input.timeZone
      ? `We'll call you again: ${formatWhen(input.nextWhen, input.timeZone)} (${input.timeZone})`
      : null;
  const info = input.infoToSend?.trim();
  const summary = input.summary?.trim();

  return sendCustomerEmail({
    contact: input.contact,
    scope: input.scope,
    subject: info
      ? "Information from our call"
      : "Summary of our call",
    activityTitle: info ? "Emailed promised information" : "Emailed call summary",
    text: [
      `Hi ${input.contact.firstName},`,
      "",
      "Thanks for taking the time to speak with us.",
      summary ? `\n${summary}` : null,
      info ? `\nHere's what we promised to share:\n${info}` : null,
      whenLine ? `\n${whenLine}` : null,
      "",
      signOff(),
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });
}
