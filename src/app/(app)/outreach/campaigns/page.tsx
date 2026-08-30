import Link from "next/link";
import { Megaphone } from "lucide-react";
import {
  EmailEmptyState,
  EmailPageShell,
  EmailPrimaryButton,
  EmailStatusBadge,
} from "@/components/outreach/email-os-ui";
import { getEmailOutreachRepository } from "@/lib/data/email-outreach-store";
import { getTenantScope } from "@/lib/tenant/context";

const CAMPAIGN_BARS = [
  "from-[#2f7f92] to-cyan-400",
  "from-[#1a2f59] to-sky-500",
  "from-[#a8894f] to-[#2f7f92]",
  "from-emerald-500 to-teal-400",
] as const;

export default async function EmailCampaignsPage() {
  const scope = await getTenantScope();
  const campaigns = await getEmailOutreachRepository().listCampaigns(scope);

  return (
    <EmailPageShell
      title="Campaigns"
      description="Compose, target CRM contacts, and send through Brevo."
      actions={
        <EmailPrimaryButton href="/outreach/campaigns/new">
          New campaign
        </EmailPrimaryButton>
      }
    >
      {campaigns.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign, index) => (
            <Link
              key={campaign.id}
              href={`/outreach/campaigns/${campaign.id}`}
              className="group overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated transition-all hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
            >
              <div
                className={`h-1.5 bg-gradient-to-r ${CAMPAIGN_BARS[index % CAMPAIGN_BARS.length]}`}
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground group-hover:text-cyan-800 dark:group-hover:text-cyan-200">
                      {campaign.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">
                      {campaign.subject}
                    </p>
                  </div>
                  <EmailStatusBadge status={campaign.status} />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted">
                  <span>{campaign.dailySendLimit}/day</span>
                  <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                    Open →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmailEmptyState
          icon={Megaphone}
          title="No email campaigns yet"
          description="Write a message, pick CRM contacts, and send through Brevo."
          action={
            <EmailPrimaryButton href="/outreach/campaigns/new">
              Create campaign
            </EmailPrimaryButton>
          }
        />
      )}
    </EmailPageShell>
  );
}

export const metadata = { title: "Email OS · Campaigns" };
