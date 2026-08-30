import Link from "next/link";
import {
  EmailKpiCard,
  EmailPageShell,
  EmailPanel,
  EmailPrimaryButton,
  EmailStatChip,
  EmailStatusBadge,
} from "@/components/outreach/email-os-ui";
import { getBrevoRuntimeStatus } from "@/lib/channels/brevo-client";
import { getEmailOutreachRepository } from "@/lib/data/email-outreach-store";
import { buildEmailOutreachMetrics } from "@/lib/email-outreach/metrics";
import { getTenantScope } from "@/lib/tenant/context";

export default async function EmailOutreachDashboardPage() {
  const scope = await getTenantScope();
  const repo = getEmailOutreachRepository();
  const [campaigns, queue] = await Promise.all([
    repo.listCampaigns(scope),
    repo.listQueue(scope),
  ]);
  const metrics = buildEmailOutreachMetrics(campaigns, queue);
  const brevo = getBrevoRuntimeStatus();
  const recent = campaigns.slice(0, 6);

  return (
    <EmailPageShell
      title="Email Outreach"
      subtitle="Brevo-powered campaigns for CRM contacts. Super admin only."
      tone="cyan"
      actions={
        <EmailPrimaryButton href="/outreach/campaigns/new">
          New campaign
        </EmailPrimaryButton>
      }
    >
      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <EmailKpiCard
            label="Campaigns"
            value={String(metrics.campaigns)}
            hint={`${metrics.running} running`}
            tone="cyan"
          />
          <EmailKpiCard
            label="Sent"
            value={String(metrics.sent)}
            hint={`${metrics.queued} waiting`}
            tone="navy"
          />
          <EmailKpiCard
            label="Open rate"
            value={`${metrics.openRate}%`}
            hint={`${metrics.opened} opened`}
            tone="green"
          />
          <EmailKpiCard
            label="Click rate"
            value={`${metrics.clickRate}%`}
            hint={`${metrics.clicked} clicked`}
            tone="gold"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-4">
          <EmailStatChip label="Delivered" value={metrics.delivered} tone="green" />
          <EmailStatChip label="Bounced" value={metrics.bounced} tone="amber" />
          <EmailStatChip label="Failed" value={metrics.failed} tone="rose" />
          <EmailStatChip
            label="Brevo"
            value={brevo.configured ? "Live" : "Simulate"}
            tone={brevo.configured ? "green" : "amber"}
          />
        </div>

        <EmailPanel title="Recent campaigns" tone="cyan">
          {recent.length ? (
            <div className="space-y-2">
              {recent.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/outreach/campaigns/${campaign.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 hover:border-gold/40"
                >
                  <div>
                    <p className="font-medium text-foreground">{campaign.name}</p>
                    <p className="text-xs text-muted">{campaign.subject}</p>
                  </div>
                  <EmailStatusBadge status={campaign.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              No campaigns yet. Create one to start sending through Brevo.
            </p>
          )}
        </EmailPanel>
      </div>
    </EmailPageShell>
  );
}

export const metadata = { title: "Email OS" };
