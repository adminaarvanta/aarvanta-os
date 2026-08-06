import Link from "next/link";
import { InsightsDashboard } from "@/components/voice/insights-dashboard";
import { VoicePageShell } from "@/components/voice/voice-ui";
import {
  buildAgentPerformance,
  buildFunnelMetrics,
  buildInsightCards,
} from "@/lib/calling/campaign-analytics";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function VoiceInsightsPage() {
  const scope = await getTenantScope();
  const repo = getCallingAgentRepository();
  const [queue, sessions, meetings] = await Promise.all([
    repo.listQueue(scope),
    repo.listSessions(scope),
    repo.listMeetings(scope),
  ]);

  const funnel = buildFunnelMetrics({ queue, sessions, meetings });
  const performance = buildAgentPerformance({ sessions, meetings, queue });
  const insights = buildInsightCards({ sessions, meetings, performance });

  const trendMap = new Map<string, { calls: number; bookings: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(5, 10);
    trendMap.set(key, { calls: 0, bookings: 0 });
  }
  for (const s of sessions) {
    const key = s.startedAt.slice(5, 10);
    const row = trendMap.get(key);
    if (row) row.calls += 1;
  }
  for (const m of meetings) {
    const key = m.createdAt.slice(5, 10);
    const row = trendMap.get(key);
    if (row) row.bookings += 1;
  }
  const trend = [...trendMap.entries()].map(([day, v]) => ({ day, ...v }));

  return (
    <VoicePageShell
      title="Insights"
      subtitle="Funnel, agent performance, and AI recommendations"
      tone="green"
      actions={
        <Link
          href="/api/voice/insights/export"
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:border-gold/40"
        >
          Export CSV
        </Link>
      }
    >
      <InsightsDashboard
        funnel={funnel}
        performance={performance}
        insights={insights}
        trend={trend}
      />
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Insights" };
