import { notFound } from "next/navigation";
import { Inbox, MailWarning, Send } from "lucide-react";
import { EmailCampaignActions } from "@/components/outreach/campaign-actions";
import { EmailCampaignComposer } from "@/components/outreach/campaign-composer";
import {
  EmailBackLink,
  EmailEmptyState,
  EmailPageShell,
  EmailSection,
  EmailStatusBadge,
} from "@/components/outreach/email-os-ui";
import { StatTile } from "@/components/ui/os/stat-tile";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getEmailOutreachRepository } from "@/lib/data/email-outreach-store";
import { buildEmailPreviewHtml } from "@/lib/email-outreach/html-utils";
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
  const previewHtml = buildEmailPreviewHtml(
    campaign.htmlBody,
    campaign.textBody
  );

  return (
    <EmailPageShell
      title={campaign.name}
      description={campaign.subject}
      back={<EmailBackLink href="/outreach/campaigns" label="All campaigns" />}
      actions={
        <>
          <EmailStatusBadge status={campaign.status} />
          <EmailCampaignActions
            campaignId={campaign.id}
            status={campaign.status}
          />
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Queued"
          value={queue.length}
          icon={Inbox}
          sub={`${stats.pending ?? 0} pending`}
          tone="navy"
        />
        <StatTile
          label="Sent"
          value={stats.sent ?? 0}
          icon={Send}
          sub={`${stats.delivered ?? 0} delivered`}
          tone="cyan"
        />
        <StatTile
          label="Opened"
          value={stats.opened ?? 0}
          icon={Inbox}
          sub={`${stats.clicked ?? 0} clicked`}
          tone="emerald"
        />
        <StatTile
          label="Problems"
          value={(stats.bounced ?? 0) + (stats.failed ?? 0)}
          icon={MailWarning}
          sub={`${stats.bounced ?? 0} bounced`}
          tone="rose"
        />
      </div>

      {campaign.status === "draft" ? (
        <EmailSection title="Edit draft" accent="gold">
          <EmailCampaignComposer contacts={contacts} campaign={campaign} />
        </EmailSection>
      ) : (
        <EmailSection title="Message" accent="cyan">
          <p className="text-sm font-medium text-foreground">
            {campaign.subject}
          </p>
          {campaign.previewText ? (
            <p className="mt-1 text-xs text-muted">{campaign.previewText}</p>
          ) : null}
          <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-white">
            <iframe
              title="Campaign HTML preview"
              sandbox=""
              srcDoc={previewHtml}
              className="h-[360px] w-full bg-white"
            />
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-muted">
              Plain text
            </summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-border/70 bg-background/70 p-3 text-sm text-foreground">
              {campaign.textBody}
            </pre>
          </details>
        </EmailSection>
      )}

      <EmailSection title="Send queue" accent="navy" flush={queue.length > 0}>
        {queue.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface-muted/60 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Contact</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Sent</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => {
                  const contact = contactById.get(item.contactId);
                  return (
                    <tr
                      key={item.id}
                      className="border-t border-border/70 last:border-b-0"
                    >
                      <td className="px-4 py-2.5 font-medium">
                        {contact ? contactDisplayName(contact) : item.toName}
                      </td>
                      <td className="px-4 py-2.5 text-muted">{item.toEmail}</td>
                      <td className="px-4 py-2.5">
                        <EmailStatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">
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
          <EmailEmptyState
            title="Queue is empty"
            description="Start this campaign to build the send list from your CRM audience."
          />
        )}
      </EmailSection>
    </EmailPageShell>
  );
}

export const metadata = { title: "Email OS · Campaign" };
