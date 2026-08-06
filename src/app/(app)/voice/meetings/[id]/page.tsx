import Link from "next/link";
import { notFound } from "next/navigation";
import { MeetingActions } from "@/components/voice/meeting-actions";
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
    <>
      <header className="border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <p className="text-xs text-muted">
          <Link href="/voice/meetings" className="hover:text-gold">
            Meetings
          </Link>
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          Meeting confirmed
        </h2>
      </header>
      <div className="p-4 sm:p-6">
        <div className="max-w-lg rounded-xl border border-border bg-surface-elevated p-5">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Lead</dt>
              <dd className="text-foreground">
                {contact ? contactDisplayName(contact) : meeting.leadId}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Company</dt>
              <dd className="text-foreground">{company?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Date / time</dt>
              <dd className="text-foreground">
                {new Date(meeting.meetingStart).toLocaleString(undefined, {
                  timeZone: meeting.timezone,
                })}{" "}
                ({meeting.timezone})
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Duration</dt>
              <dd className="text-foreground">
                {meeting.durationMinutes} minutes
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
          <div className="mt-5">
            <MeetingActions
              meetingId={meeting.id}
              calendarEventId={meeting.calendarEventId}
            />
          </div>
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
    </>
  );
}

export const metadata = { title: "Voice OS · Meeting" };
