import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignActions } from "@/components/voice/campaign-actions";
import { QueueKanban, type QueueCard } from "@/components/voice/queue-kanban";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

type Params = { params: Promise<{ id: string }> };

export default async function CampaignDetailPage({ params }: Params) {
  const { id } = await params;
  const scope = await getTenantScope();
  const repo = getCallingAgentRepository();
  const campaign = await repo.getCampaign(id, scope);
  if (!campaign) notFound();

  const [queue, contacts, companies, agent] = await Promise.all([
    repo.listQueue(scope, { campaignId: id }),
    getCrmRepository().listContacts(scope),
    getCrmRepository().listCompanies(scope),
    repo.getAgent(campaign.voiceAgentId, scope),
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted">
              <Link href="/voice/campaigns" className="hover:text-gold">
                Campaigns
              </Link>
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              {campaign.name}
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              {campaign.goal} · Agent {agent?.name ?? "—"} · {campaign.status}
            </p>
          </div>
          <CampaignActions campaignId={campaign.id} status={campaign.status} />
        </div>
      </header>
      <QueueKanban items={cards} campaignId={campaign.id} />
    </>
  );
}

export const metadata = { title: "Voice OS · Campaign" };
