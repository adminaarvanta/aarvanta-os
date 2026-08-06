import Link from "next/link";
import {
  LiveActivityChart,
  TopHoursChart,
} from "@/components/voice/dashboard-charts";
import { buildCampaignDashboardMetrics } from "@/lib/calling/campaign-analytics";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function VoiceOsDashboardPage() {
  const scope = await getTenantScope();
  const repo = getCallingAgentRepository();
  const [campaigns, queue, sessions, meetings, reminders] = await Promise.all([
    repo.listCampaigns(scope),
    repo.listQueue(scope),
    repo.listSessions(scope),
    repo.listMeetings(scope),
    repo.listReminders(scope),
  ]);

  const metrics = buildCampaignDashboardMetrics({
    campaigns,
    queue,
    sessions,
    meetings,
    reminders,
  });

  const activeCampaign =
    campaigns.find((c) => c.status === "running") ?? campaigns[0];

  const kpis = [
    { label: "Progress", value: `${metrics.progress}%` },
    { label: "Meetings Booked", value: String(metrics.meetingsBooked) },
    { label: "Booking Rate", value: `${metrics.bookingRate}%` },
    { label: "AI Confidence", value: `${metrics.aiConfidence}%` },
  ];

  const today = [
    { label: "Completed", value: metrics.today.completed },
    { label: "Pending", value: metrics.today.pending },
    { label: "Busy", value: metrics.today.busy },
    { label: "Failed", value: metrics.today.failed },
    { label: "Voicemail", value: metrics.today.voicemail },
    { label: "Callbacks", value: metrics.today.callbacks },
    { label: "Meetings", value: metrics.today.meetings },
  ];

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Voice OS
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              {activeCampaign
                ? `${activeCampaign.name} · Mission control`
                : "AI outbound calling mission control"}
            </p>
          </div>
          <Link
            href="/voice/campaigns/new"
            className="rounded-lg bg-gold px-3 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            New campaign
          </Link>
        </div>
      </header>

      <div className="space-y-6 p-4 sm:p-6">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-border bg-surface-elevated px-4 py-4"
            >
              <p className="text-xs uppercase tracking-wide text-muted">
                {kpi.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {kpi.value}
              </p>
            </div>
          ))}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-medium text-foreground">
            Today&apos;s overview
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {today.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border bg-surface px-3 py-3 text-center"
              >
                <p className="text-lg font-semibold text-foreground">
                  {item.value}
                </p>
                <p className="text-xs text-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-elevated p-4">
            <h3 className="mb-2 text-sm font-medium text-foreground">
              Live activity
            </h3>
            <LiveActivityChart data={metrics.liveActivity} />
          </div>
          <div className="rounded-xl border border-border bg-surface-elevated p-4">
            <h3 className="mb-2 text-sm font-medium text-foreground">
              Top performing hours
            </h3>
            <TopHoursChart data={metrics.topHours} />
          </div>
        </section>

        <section className="flex flex-wrap gap-3 text-sm">
          <Link href="/voice/queue" className="text-gold hover:underline">
            View queue ({metrics.queued})
          </Link>
          <Link href="/voice/live" className="text-gold hover:underline">
            Live calls ({metrics.inProgress})
          </Link>
          <Link href="/voice/insights" className="text-gold hover:underline">
            Insights
          </Link>
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "Voice OS" };
