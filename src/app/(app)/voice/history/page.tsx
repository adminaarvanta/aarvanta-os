import Link from "next/link";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

export default async function VoiceHistoryPage() {
  const scope = await getTenantScope();
  const [sessions, contacts] = await Promise.all([
    getCallingAgentRepository().listSessions(scope),
    getCrmRepository().listContacts(scope),
  ]);
  const contactById = new Map(contacts.map((c) => [c.id, c]));

  return (
    <>
      <header className="border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-foreground">Call History</h2>
        <p className="text-xs text-muted sm:text-sm">
          Replay transcripts, AI decisions, and CRM updates
        </p>
      </header>
      <div className="divide-y divide-border">
        {sessions.map((s) => {
          const contact = s.contactId ? contactById.get(s.contactId) : null;
          return (
            <Link
              key={s.id}
              href={`/voice/history/${s.id}`}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 hover:bg-surface-elevated sm:px-6"
            >
              <div>
                <p className="font-medium text-foreground">
                  {contact ? contactDisplayName(contact) : s.contactId ?? "Call"}
                </p>
                <p className="text-xs text-muted">
                  {s.outcome?.replace(/_/g, " ") ?? s.status}
                  {s.durationSeconds != null
                    ? ` · ${Math.round(s.durationSeconds / 60)}m`
                    : ""}
                  {s.callScore != null ? ` · Score ${s.callScore}` : ""}
                </p>
              </div>
              <span className="text-xs text-muted">
                {new Date(s.startedAt).toLocaleString()}
              </span>
            </Link>
          );
        })}
        {!sessions.length ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            No call sessions yet.
          </p>
        ) : null}
      </div>
    </>
  );
}

export const metadata = { title: "Voice OS · Call History" };
