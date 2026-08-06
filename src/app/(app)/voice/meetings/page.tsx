import Link from "next/link";
import {
  VoiceEmptyState,
  VoicePageShell,
  VoiceStatusBadge,
} from "@/components/voice/voice-ui";
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
    <VoicePageShell
      title="Meetings"
      subtitle="Bookings created by the AI calling agent"
      tone="green"
    >
      {meetings.length ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
          {meetings.map((m) => {
            const contact = contactById.get(m.leadId);
            const company = contact?.accountId
              ? companyById.get(contact.accountId)
              : undefined;
            return (
              <Link
                key={m.id}
                href={`/voice/meetings/${m.id}`}
                className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--chart-ai)]/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground">{m.title}</p>
                  <VoiceStatusBadge status={m.status} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {contact ? contactDisplayName(contact) : m.leadId}
                  {company ? ` · ${company.name}` : ""}
                </p>
                <p className="mt-3 text-sm font-medium text-[var(--chart-ai)]">
                  {new Date(m.meetingStart).toLocaleString(undefined, {
                    timeZone: m.timezone,
                  })}
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <VoiceEmptyState title="No meetings booked yet" />
      )}
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Meetings" };
