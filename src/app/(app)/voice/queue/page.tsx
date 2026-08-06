import { QueueKanban, type QueueCard } from "@/components/voice/queue-kanban";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

export default async function VoiceQueuePage() {
  const scope = await getTenantScope();
  const repo = getCallingAgentRepository();
  const [queue, contacts, companies] = await Promise.all([
    repo.listQueue(scope),
    getCrmRepository().listContacts(scope),
    getCrmRepository().listCompanies(scope),
  ]);

  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const companyById = new Map(companies.map((c) => [c.id, c]));

  const cards: QueueCard[] = queue.map((item) => {
    const contact = contactById.get(item.contactId);
    const company = contact?.accountId
      ? companyById.get(contact.accountId)
      : undefined;
    return {
      id: item.id,
      contactId: item.contactId,
      status: item.status,
      contactName: contact ? contactDisplayName(contact) : item.contactId,
      companyName: company?.name,
      leadScore: contact?.leadScore,
      attemptCount: item.attemptCount,
      lastAttemptAt: item.lastAttemptAt,
      sessionId: item.sessionId,
    };
  });

  return (
    <>
      <header className="border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-foreground">AI Queue</h2>
        <p className="text-xs text-muted sm:text-sm">
          Kanban of pending, live, booked, and completed leads
        </p>
      </header>
      <QueueKanban items={cards} />
    </>
  );
}

export const metadata = { title: "Voice OS · Queue" };
