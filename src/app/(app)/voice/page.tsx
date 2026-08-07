import Link from "next/link";
import {
  LiveActivityChart,
  TopHoursChart,
} from "@/components/voice/dashboard-charts";
import {
  VoiceKpiCard,
  VoicePageShell,
  VoicePanel,
  VoicePrimaryButton,
  VoiceStatChip,
  type VoiceTone,
} from "@/components/voice/voice-ui";
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

  const kpis: { label: string; value: string; hint: string; tone: VoiceTone }[] =
    [
      {
        label: "Progress",
        value: `${metrics.progress}%`,
        hint: "Toward meeting target",
        tone: "navy",
      },
      {
        label: "Meetings Booked",
        value: String(metrics.meetingsBooked),
        hint: "Confirmed sessions",
        tone: "green",
      },
      {
        label: "Booking Rate",
        value: `${metrics.bookingRate}%`,
        hint: "Calls → meetings",
        tone: "cyan",
      },
      {
        label: "AI Confidence",
        value: `${metrics.aiConfidence}%`,
        hint: "Avg intent confidence",
        tone: "gold",
      },
    ];

  const today: { label: string; value: number; tone: VoiceTone }[] = [
    { label: "Completed", value: metrics.today.completed, tone: "green" },
    { label: "Pending", value: metrics.today.pending, tone: "blue" },
    { label: "Busy", value: metrics.today.busy, tone: "amber" },
    { label: "Failed", value: metrics.today.failed, tone: "rose" },
    { label: "Voicemail", value: metrics.today.voicemail, tone: "amber" },
    { label: "Callbacks", value: metrics.today.callbacks, tone: "cyan" },
    { label: "Meetings", value: metrics.today.meetings, tone: "green" },
  ];

  return (
    <VoicePageShell
      title={activeCampaign?.name ?? "Mission control"}
      subtitle={
        activeCampaign
          ? `${activeCampaign.goal} · Live campaign dashboard`
          : "AI outbound calling mission control"
      }
      tone="navy"
      actions={
        <>
          <Link
            href="/voice/dialer"
            className="inline-flex items-center rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:border-[var(--chart-ops)]"
          >
            Dialer
          </Link>
          <Link
            href="/voice/live"
            className="inline-flex items-center rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:border-[var(--chart-ops)]"
          >
            Live calls
          </Link>
          <VoicePrimaryButton href="/voice/campaigns/new">
            New campaign
          </VoicePrimaryButton>
        </>
      }
    >
      <div className="space-y-6 p-4 sm:p-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <VoiceKpiCard key={kpi.label} {...kpi} />
          ))}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Today&apos;s overview
            </h3>
            <span className="text-xs text-muted">
              {metrics.inProgress} live · {metrics.queued} queued
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {today.map((item) => (
              <VoiceStatChip
                key={item.label}
                label={item.label}
                value={item.value}
                tone={item.tone}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <VoicePanel title="Live activity" tone="cyan">
            <LiveActivityChart data={metrics.liveActivity} />
          </VoicePanel>
          <VoicePanel title="Top performing hours" tone="green">
            <TopHoursChart data={metrics.topHours} />
          </VoicePanel>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {(
            [
              {
                href: "/voice/queue",
                label: "Queue",
                value: metrics.queued,
                tone: "blue" as const,
              },
              {
                href: "/voice/live",
                label: "In progress",
                value: metrics.inProgress,
                tone: "cyan" as const,
              },
              {
                href: "/voice/insights",
                label: "Qualified",
                value: metrics.qualified,
                tone: "gold" as const,
              },
            ] as const
          ).map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-gold">Open →</p>
            </Link>
          ))}
        </section>
      </div>
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS" };
