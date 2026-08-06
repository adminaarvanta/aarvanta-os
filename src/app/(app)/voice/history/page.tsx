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

export default async function VoiceHistoryPage() {
  const scope = await getTenantScope();
  const [sessions, contacts] = await Promise.all([
    getCallingAgentRepository().listSessions(scope),
    getCrmRepository().listContacts(scope),
  ]);
  const contactById = new Map(contacts.map((c) => [c.id, c]));

  return (
    <VoicePageShell
      title="Call History"
      subtitle="Replay transcripts, AI decisions, and CRM updates"
      tone="blue"
    >
      {sessions.length ? (
        <div className="divide-y divide-border p-2 sm:p-4">
          {sessions.map((s) => {
            const contact = s.contactId ? contactById.get(s.contactId) : null;
            return (
              <Link
                key={s.id}
                href={`/voice/history/${s.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-4 transition hover:bg-surface-elevated sm:px-4"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {contact
                      ? contactDisplayName(contact)
                      : s.contactId ?? "Call"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <VoiceStatusBadge status={s.outcome ?? s.status} />
                    {s.durationSeconds != null ? (
                      <span className="text-xs text-muted">
                        {Math.round(s.durationSeconds / 60)}m
                      </span>
                    ) : null}
                    {s.callScore != null ? (
                      <span className="rounded-md bg-[var(--chart-revenue-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--chart-revenue)]">
                        {s.callScore}/5
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="text-xs text-muted">
                  {new Date(s.startedAt).toLocaleString()}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <VoiceEmptyState title="No call sessions yet" />
      )}
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Call History" };
