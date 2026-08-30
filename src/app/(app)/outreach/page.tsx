import Link from "next/link";
import {
  ArrowUpRight,
  Mail,
  Megaphone,
  MousePointerClick,
  Send,
} from "lucide-react";
import {
  EmailPageShell,
  EmailPrimaryButton,
  EmailSection,
  EmailStatusBadge,
} from "@/components/outreach/email-os-ui";
import { StatTile } from "@/components/ui/os/stat-tile";
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
  const briefing = [
    {
      href: "/outreach/campaigns/new",
      text:
        campaigns.length === 0
          ? "Create your first campaign and pick CRM contacts to email."
          : `${metrics.running} campaign${metrics.running === 1 ? "" : "s"} running — ${metrics.queued} still waiting to send.`,
    },
    {
      href: "/outreach/settings",
      text: brevo.configured
        ? `Brevo is live as ${brevo.sender.name} <${brevo.sender.email}>.`
        : "Connect a Brevo SMTP key in Settings before starting a live send.",
    },
    {
      href: "/outreach/campaigns",
      text: `${metrics.openRate}% open rate and ${metrics.clickRate}% click rate across ${metrics.sent} sends.`,
    },
  ];

  return (
    <EmailPageShell
      title="Outreach workspace"
      description="Campaigns, CRM audiences, and Brevo delivery in one place."
      actions={
        <EmailPrimaryButton href="/outreach/campaigns/new">
          New campaign
        </EmailPrimaryButton>
      }
    >
      <section className="overflow-hidden rounded-2xl border border-cyan-500/25 bg-surface-elevated shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="h-1.5 bg-gradient-to-r from-[#2f7f92] via-[#a8894f] to-[#1a2f59]" />
        <div className="bg-gradient-to-br from-cyan-500/[0.12] via-surface-elevated to-gold/10 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f7f92] to-[#1a2f59] text-white shadow-[0_6px_14px_rgba(47,127,146,0.28)]">
              <Mail className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-foreground">
                Email briefing
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Super-admin outreach only — replies still land in the inbox.
              </p>
              <ul className="mt-3 space-y-2">
                {briefing.map((line, index) => (
                  <li key={line.text}>
                    <Link
                      href={line.href}
                      className="group flex items-start gap-3 rounded-xl border border-border/80 bg-background/70 px-3 py-2.5 text-sm text-foreground transition hover:border-cyan-400/40 hover:bg-surface-muted"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">{line.text}</span>
                      <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted transition group-hover:text-cyan-700 dark:group-hover:text-cyan-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Campaigns"
          value={metrics.campaigns}
          icon={Megaphone}
          href="/outreach/campaigns"
          sub={`${metrics.running} running`}
          tone="cyan"
        />
        <StatTile
          label="Sent"
          value={metrics.sent}
          icon={Send}
          href="/outreach/campaigns"
          sub={`${metrics.queued} waiting`}
          tone="navy"
        />
        <StatTile
          label="Open rate"
          value={`${metrics.openRate}%`}
          icon={Mail}
          sub={`${metrics.opened} opened`}
          tone="emerald"
        />
        <StatTile
          label="Click rate"
          value={`${metrics.clickRate}%`}
          icon={MousePointerClick}
          sub={`${metrics.clicked} clicked`}
          tone="gold"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Delivered"
          value={metrics.delivered}
          sub="Inbox confirmed"
          tone="emerald"
        />
        <StatTile
          label="Bounced"
          value={metrics.bounced}
          sub="Hard or soft"
          tone="rose"
        />
        <StatTile
          label="Failed"
          value={metrics.failed}
          sub="Send errors"
          tone="rose"
        />
        <StatTile
          label="Brevo"
          value={brevo.configured ? "Live" : "Simulate"}
          href="/outreach/settings"
          sub={brevo.configured ? brevo.sender.email : "Add SMTP key"}
          tone={brevo.configured ? "cyan" : "gold"}
        />
      </div>

      <EmailSection
        title="Recent campaigns"
        accent="cyan"
        action={
          <Link
            href="/outreach/campaigns"
            className="text-xs font-semibold text-cyan-700 hover:underline dark:text-cyan-300"
          >
            View all
          </Link>
        }
      >
        {recent.length ? (
          <div className="space-y-2">
            {recent.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/outreach/campaigns/${campaign.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/70 px-3 py-2.5 transition hover:border-cyan-400/40 hover:bg-surface-muted"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {campaign.name}
                  </p>
                  <p className="truncate text-xs text-muted">{campaign.subject}</p>
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
      </EmailSection>
    </EmailPageShell>
  );
}

export const metadata = { title: "Email OS" };
