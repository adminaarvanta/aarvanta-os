import { CallingWorkspace, type CallLogItem } from "@/components/calling/calling-workspace";
import { getRepository } from "@/lib/data/repository";
import { getTenantScope } from "@/lib/tenant/context";

export default async function CallingPage() {
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
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">Calling</h2>
        <p className="text-xs text-muted sm:text-sm">
          Twilio voice — outbound spoken messages and full call history.
        </p>
      </header>
      <CallingWorkspace calls={calls} />
    </>
  );
}

export const metadata = { title: "Calling" };
