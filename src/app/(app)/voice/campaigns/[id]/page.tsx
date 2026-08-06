import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignActions } from "@/components/voice/campaign-actions";
import { QueueKanban, type QueueCard } from "@/components/voice/queue-kanban";
import {
  VoicePageShell,
  VoiceStatusBadge,
} from "@/components/voice/voice-ui";
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
    <VoicePageShell
      title={campaign.name}
      subtitle={`${campaign.goal} · Agent ${agent?.name ?? "—"} · ${campaign.timezone}`}
      tone="gold"
      actions={
        <>
          <VoiceStatusBadge status={campaign.status} />
          <CampaignActions campaignId={campaign.id} status={campaign.status} />
          <Link
            href="/voice/campaigns"
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted hover:text-foreground"
          >
            All campaigns
          </Link>
        </>
      }
    >
      <QueueKanban items={cards} campaignId={campaign.id} />
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Campaign" };
