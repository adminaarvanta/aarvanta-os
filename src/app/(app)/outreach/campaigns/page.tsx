import Link from "next/link";
import {
  EmailEmptyState,
  EmailPageShell,
  EmailPrimaryButton,
  EmailStatusBadge,
} from "@/components/outreach/email-os-ui";
import { getEmailOutreachRepository } from "@/lib/data/email-outreach-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function EmailCampaignsPage() {
  const scope = await getTenantScope();
  const campaigns = await getEmailOutreachRepository().listCampaigns(scope);

  return (
    <EmailPageShell
      title="Campaigns"
      subtitle="Compose, target CRM contacts, and send through Brevo"
      tone="cyan"
      actions={
        <EmailPrimaryButton href="/outreach/campaigns/new">
          New campaign
        </EmailPrimaryButton>
      }
    >
      {campaigns.length ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/outreach/campaigns/${c.id}`}
              className="group rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground group-hover:text-gold-dark dark:group-hover:text-gold-bright">
                    {c.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">{c.subject}</p>
                </div>
                <EmailStatusBadge status={c.status} />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted">
                <span>{c.dailySendLimit}/day</span>
                <span className="font-medium text-gold">Open →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmailEmptyState
          title="No email campaigns yet"
          body="Write a message, pick CRM contacts, and send through Brevo."
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
