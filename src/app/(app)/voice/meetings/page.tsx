import Link from "next/link";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

export default async function VoiceMeetingsPage() {
  const scope = await getTenantScope();
  const [meetings, contacts, companies] = await Promise.all([
    getCallingAgentRepository().listMeetings(scope),
    getCrmRepository().listContacts(scope),
    getCrmRepository().listCompanies(scope),
  ]);
  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const companyById = new Map(companies.map((c) => [c.id, c]));

  return (
    <>
      <header className="border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-foreground">Meetings</h2>
        <p className="text-xs text-muted sm:text-sm">
          Bookings created by the AI calling agent
        </p>
      </header>
      <div className="divide-y divide-border">
        {meetings.map((m) => {
          const contact = contactById.get(m.leadId);
          const company = contact?.accountId
            ? companyById.get(contact.accountId)
            : undefined;
          return (
            <Link
              key={m.id}
              href={`/voice/meetings/${m.id}`}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 hover:bg-surface-elevated sm:px-6"
            >
              <div>
                <p className="font-medium text-foreground">{m.title}</p>
                <p className="text-xs text-muted">
                  {contact ? contactDisplayName(contact) : m.leadId}
                  {company ? ` · ${company.name}` : ""}
                </p>
              </div>
              <div className="text-right text-xs text-muted">
                <p>
                  {new Date(m.meetingStart).toLocaleString(undefined, {
                    timeZone: m.timezone,
                  })}
                </p>
                <p className="capitalize">{m.status}</p>
              </div>
            </Link>
          );
        })}
        {!meetings.length ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            No meetings booked yet.
          </p>
        ) : null}
      </div>
    </>
  );
}

export const metadata = { title: "Voice OS · Meetings" };
