import Link from "next/link";
import { CallingWorkspace, type CallLogItem } from "@/components/calling/calling-workspace";
import { VoicePageShell } from "@/components/voice/voice-ui";
import { getRepository } from "@/lib/data/repository";
import { getTenantScope } from "@/lib/tenant/context";

export default async function VoiceSettingsPage() {
  const scope = await getTenantScope();
  const repo = getRepository();
  const list = await repo.listConversations(scope);

  const candidates = list.filter(
    (c) =>
      c.channels.includes("voice") ||
      c.timeline.some((e) => e.type === "call")
  );

  const full = await Promise.all(
    candidates.map((c) => repo.getConversation(c.id, scope))
  );

  const calls: CallLogItem[] = [];
  for (const conv of full) {
    if (!conv) continue;
    for (const event of conv.timeline) {
      if (event.type !== "call") continue;
      calls.push({
        id: event.id,
        conversationId: conv.id,
        contactName: conv.contact.name,
        phone: conv.contact.phone,
        direction: event.direction,
        durationSeconds: event.durationSeconds,
        summary: event.summary,
        occurredAt: event.occurredAt,
      });
    }
  }
  calls.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return (
    <VoicePageShell
      title="Settings"
      subtitle="Manual dialer, voice config, and calendar connection"
      tone="slate"
    >
      <div className="border-b border-border px-4 py-3 sm:px-6">
        <p className="text-sm text-muted">
          Connect Google Calendar from{" "}
          <Link href="/voice/calendar" className="font-medium text-gold hover:underline">
            Calendar
          </Link>{" "}
          or Integrations. Use the dialer below for one-off outbound calls.
        </p>
      </div>
      <CallingWorkspace calls={calls} />
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Settings" };
