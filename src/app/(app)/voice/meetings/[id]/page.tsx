import Link from "next/link";
import { notFound } from "next/navigation";
import { MeetingActions } from "@/components/voice/meeting-actions";
import {
  VoicePageShell,
  VoiceStatusBadge,
} from "@/components/voice/voice-ui";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

type Params = { params: Promise<{ id: string }> };

export default async function MeetingDetailPage({ params }: Params) {
  const { id } = await params;
  const scope = await getTenantScope();
  const meeting = await getCallingAgentRepository().getMeeting(id, scope);
  if (!meeting) notFound();

  const contact = await getCrmRepository().getContact(meeting.leadId, scope);
  const company =
    contact?.accountId
      ? await getCrmRepository().getCompany(contact.accountId, scope)
      : null;

  return (
    <VoicePageShell
      title={meeting.title}
      subtitle="Meeting booked by the AI calling agent"
      tone="green"
      actions={
        <Link
          href="/voice/meetings"
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
        >
          ← Meetings
        </Link>
      }
    >
      <div className="p-4 sm:p-6">
        <div className="max-w-lg overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-sm">
          <div className="border-b border-border bg-gradient-to-r from-[var(--chart-ai-soft)] to-transparent px-5 py-4">
            <VoiceStatusBadge status={meeting.status} />
            <p className="mt-2 text-lg font-semibold text-[var(--chart-ai)]">
              {new Date(meeting.meetingStart).toLocaleString(undefined, {
                timeZone: meeting.timezone,
              })}
            </p>
          </div>
          <dl className="space-y-3 p-5 text-sm">
            <div>
              <dt className="text-xs text-muted">Lead</dt>
              <dd className="font-medium text-foreground">
                {contact ? contactDisplayName(contact) : meeting.leadId}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Company</dt>
              <dd className="text-foreground">{company?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Duration</dt>
              <dd className="text-foreground">
                {meeting.durationMinutes} minutes · {meeting.timezone}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Sales rep</dt>
              <dd className="text-foreground">
                {meeting.salesRepName ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Meeting link</dt>
              <dd className="text-foreground">
                {meeting.meetLink ? (
                  <a
                    href={meeting.meetLink}
                    className="text-gold hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {meeting.meetLink}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
          <div className="border-t border-border px-5 py-4">
            <MeetingActions
              meetingId={meeting.id}
              calendarEventId={meeting.calendarEventId}
            />
            <p className="mt-3 text-xs text-muted">
              <Link
                href={`/voice/calendar?leadId=${meeting.leadId}`}
                className="text-gold hover:underline"
              >
                View in calendar / pick another slot
              </Link>
            </p>
          </div>
        </div>
      </div>
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Meeting" };
