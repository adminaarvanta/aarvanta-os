import {
  VoiceDialer,
  type CallLogItem,
} from "@/components/voice/voice-dialer";
import { VoicePageShell, VoicePrimaryButton } from "@/components/voice/voice-ui";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

export default async function VoiceDialerPage() {
  const scope = await getTenantScope();
  const [sessions, contacts, list] = await Promise.all([
    getCallingAgentRepository().listSessions(scope),
    getCrmRepository().listContacts(scope),
    getRepository().listConversations(scope),
  ]);

  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const callsFromSessions: CallLogItem[] = sessions
    .slice()
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 30)
    .map((s) => {
      const contact = s.contactId ? contactById.get(s.contactId) : undefined;
      return {
        id: s.id,
        conversationId: s.conversationId ?? s.id,
        contactName: contact
          ? contactDisplayName(contact)
          : s.contactId ?? "Call",
        phone: contact?.phone,
        direction: "outbound" as const,
        durationSeconds: s.durationSeconds ?? 0,
        summary: s.summary,
        occurredAt: s.startedAt,
        sessionId: s.id,
        recordingUrl: s.recordingUrl,
      };
    });

  // Fallback: conversation timeline if no sessions yet
  let calls = callsFromSessions;
  if (!calls.length) {
    const candidates = list.filter(
      (c) =>
        c.channels.includes("voice") ||
        c.timeline.some((e) => e.type === "call")
    );
    const full = await Promise.all(
      candidates.map((c) => getRepository().getConversation(c.id, scope))
    );
    const fromTimeline: CallLogItem[] = [];
    for (const conv of full) {
      if (!conv) continue;
      for (const event of conv.timeline) {
        if (event.type !== "call") continue;
        fromTimeline.push({
          id: event.id,
          conversationId: conv.id,
          contactName: conv.contact.name,
          phone: conv.contact.phone,
          direction: event.direction,
          durationSeconds: event.durationSeconds,
          summary: event.summary,
          occurredAt: event.occurredAt,
          recordingUrl: event.recordingUrl,
        });
      }
    }
    fromTimeline.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    calls = fromTimeline.slice(0, 30);
  }

  return (
    <VoicePageShell
      title="Dialer"
      subtitle="Select a CRM person and place an immediate or scheduled AI call"
      tone="cyan"
      actions={
        <VoicePrimaryButton href="/voice/live">Live calls</VoicePrimaryButton>
      }
    >
      <VoiceDialer calls={calls} />
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Dialer" };
