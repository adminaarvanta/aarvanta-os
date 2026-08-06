import Link from "next/link";
import {
  VoiceEmptyState,
  VoicePageShell,
  VoicePrimaryButton,
  VoiceStatusBadge,
} from "@/components/voice/voice-ui";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function VoiceCampaignsPage() {
  const scope = await getTenantScope();
  const campaigns = await getCallingAgentRepository().listCampaigns(scope);

  return (
    <VoicePageShell
      title="Campaigns"
      subtitle="Outbound AI calling campaigns and launch controls"
      tone="gold"
      actions={
        <VoicePrimaryButton href="/voice/campaigns/new">
          New campaign
        </VoicePrimaryButton>
      }
    >
      {campaigns.length ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/voice/campaigns/${c.id}`}
              className="group rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground group-hover:text-gold-dark dark:group-hover:text-gold-bright">
                    {c.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {c.goal}
                    {c.targetMeetings ? ` · Target ${c.targetMeetings}` : ""}
                  </p>
                </div>
                <VoiceStatusBadge status={c.status} />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted">
                <span>{c.timezone}</span>
                <span className="font-medium text-gold">Open →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <VoiceEmptyState
          title="No campaigns yet"
          body="Launch your first outbound AI campaign in a few steps."
          action={
            <VoicePrimaryButton href="/voice/campaigns/new">
              Create campaign
            </VoicePrimaryButton>
          }
        />
      )}
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Campaigns" };
