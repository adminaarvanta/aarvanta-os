import { CallingWorkspace, type CallLogItem } from "@/components/calling/calling-workspace";
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
    <>
      <header className="border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-xs text-muted sm:text-sm">
          Manual dialer, voice config, and Google Calendar connection
        </p>
      </header>
      <div className="border-b border-border px-4 py-3 sm:px-6">
        <p className="text-sm text-muted">
          Connect Google Calendar from{" "}
          <a href="/integrations" className="text-gold hover:underline">
            Integrations
          </a>{" "}
          (or use the Calendar tab after OAuth is configured).
        </p>
      </div>
      <CallingWorkspace calls={calls} />
    </>
  );
}

export const metadata = { title: "Voice OS · Settings" };
