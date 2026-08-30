import { notFound } from "next/navigation";
import { EmailCampaignActions } from "@/components/outreach/campaign-actions";
import {
  EmailBackLink,
  EmailPageShell,
  EmailPanel,
  EmailStatusBadge,
} from "@/components/outreach/email-os-ui";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getEmailOutreachRepository } from "@/lib/data/email-outreach-store";
import { campaignQueueStats } from "@/lib/email-outreach/metrics";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

type Params = { params: Promise<{ id: string }> };

export default async function EmailCampaignDetailPage({ params }: Params) {
  const { id } = await params;
  const scope = await getTenantScope();
  const repo = getEmailOutreachRepository();
  const campaign = await repo.getCampaign(id, scope);
  if (!campaign) notFound();

  const [queue, contacts] = await Promise.all([
    repo.listQueue(scope, { campaignId: id }),
    getCrmRepository().listContacts(scope),
  ]);
  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const stats = campaignQueueStats(queue);

  return (
    <EmailPageShell
      title={campaign.name}
      subtitle={campaign.subject}
      tone="cyan"
      actions={
        <>
          <EmailStatusBadge status={campaign.status} />
          <EmailCampaignActions campaignId={campaign.id} status={campaign.status} />
          <EmailBackLink href="/outreach/campaigns">All campaigns</EmailBackLink>
        </>
      }
    >
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          {Object.entries(stats).map(([status, count]) => (
            <span
              key={status}
              className="rounded-full border border-border bg-surface px-2.5 py-1 capitalize"
            >
              {status.replace(/_/g, " ")} · {count}
            </span>
          ))}
          {queue.length === 0 ? (
            <span>No recipients yet — start the campaign to build the send queue.</span>
          ) : null}
        </div>

        <EmailPanel title="Message" tone="cyan">
          <p className="text-sm font-medium text-foreground">{campaign.subject}</p>
          {campaign.previewText ? (
            <p className="mt-1 text-xs text-muted">{campaign.previewText}</p>
          ) : null}
          <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-surface-muted p-3 text-sm text-foreground">
            {campaign.textBody}
          </pre>
        </EmailPanel>

        <EmailPanel title="Send queue" tone="navy">
          {queue.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="pb-2 font-medium">Contact</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => {
                    const contact = contactById.get(item.contactId);
                    return (
                      <tr key={item.id} className="border-t border-border/70">
                        <td className="py-2 font-medium">
                          {contact ? contactDisplayName(contact) : item.toName}
                        </td>
                        <td className="py-2 text-muted">{item.toEmail}</td>
                        <td className="py-2">
                          <EmailStatusBadge status={item.status} />
                        </td>
                        <td className="py-2 text-xs text-muted">
                          {item.sentAt
                            ? new Date(item.sentAt).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Queue is empty until you start this campaign.
            </p>
          )}
        </EmailPanel>
      </div>
    </EmailPageShell>
  );
}

export const metadata = { title: "Email OS · Campaign" };
