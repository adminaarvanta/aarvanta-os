import Link from "next/link";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function VoiceCampaignsPage() {
  const scope = await getTenantScope();
  const campaigns = await getCallingAgentRepository().listCampaigns(scope);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Campaigns</h2>
          <p className="text-xs text-muted sm:text-sm">
            Outbound AI calling campaigns
          </p>
        </div>
        <Link
          href="/voice/campaigns/new"
          className="rounded-lg bg-gold px-3 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          New campaign
        </Link>
      </header>
      <div className="divide-y divide-border">
        {campaigns.map((c) => (
          <Link
            key={c.id}
            href={`/voice/campaigns/${c.id}`}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 transition-colors hover:bg-surface-elevated sm:px-6"
          >
            <div>
              <p className="font-medium text-foreground">{c.name}</p>
              <p className="text-xs text-muted">
                {c.goal}
                {c.targetMeetings ? ` · Target ${c.targetMeetings}` : ""}
              </p>
            </div>
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-muted">
              {c.status}
            </span>
          </Link>
        ))}
        {!campaigns.length ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            No campaigns yet.{" "}
            <Link href="/voice/campaigns/new" className="text-gold hover:underline">
              Create one
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}

export const metadata = { title: "Voice OS · Campaigns" };
