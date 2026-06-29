import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { FounderCopilotPanel } from "@/components/founder/founder-copilot-panel";
import { FounderStatsGrid } from "@/components/founder/founder-stats-grid";
import { PageFrame, PageScroll } from "@/components/layout/page-scroll";
import { PageHeader } from "@/components/ui/os/page-header";
import { Panel } from "@/components/ui/os/panel";
import { SectionHeader } from "@/components/ui/os/section-header";
import { buildFounderSnapshot } from "@/lib/founder/build-snapshot";
import { getFounderChatRepository } from "@/lib/data/founder-chat-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function DashboardPage() {
  const scope = await getTenantScope();
  const [snapshot, messages] = await Promise.all([
    buildFounderSnapshot(scope),
    getFounderChatRepository().listMessages(scope),
  ]);

  return (
    <PageFrame>
      <PageHeader
        icon={LayoutDashboard}
        title="Founder Dashboard"
        description="Command center — revenue, pipeline, projects, AI workforce, and Copilot."
        meta={
          <p className="text-[11px] text-muted">
            New here? Open{" "}
            <Link href="/dashboard?help=open" className="font-medium text-gold hover:text-gold-bright">
              Help
            </Link>{" "}
            for the tour or 90-second demo ·{" "}
            <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-gold">
              ⌘K
            </kbd>{" "}
            to search
          </p>
        }
      />

      <PageScroll className="space-y-8 p-4 sm:p-6">
        <section>
          <SectionHeader
            title="Business pulse"
            description="Live metrics across revenue, inbox, delivery, and AI workforce."
          />
          <FounderStatsGrid snapshot={snapshot} />
        </section>

        <Panel>
          <SectionHeader title="Today's focus" />
          <ul className="mt-3 space-y-2.5">
            {snapshot.focus.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                <span className="mt-0.5 text-gold" aria-hidden>
                  →
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Panel>

        {snapshot.sales.topOpportunities.length > 0 && (
          <Panel padding="none">
            <div className="border-b border-border-subtle px-4 py-3 sm:px-5">
              <SectionHeader
                title="Top opportunities"
                action="View pipeline"
                actionHref="/crm/pipelines"
                className="mb-0"
              />
            </div>
            <ul className="divide-y divide-border-subtle">
              {snapshot.sales.topOpportunities.map((deal) => (
                <li
                  key={deal.title}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-hover sm:px-5"
                >
                  <span className="min-w-0 text-sm text-foreground">
                    {deal.title}
                    {deal.contact && (
                      <span className="text-muted"> · {deal.contact}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-gold">
                    £{deal.value.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <FounderCopilotPanel initialMessages={messages} />
      </PageScroll>
    </PageFrame>
  );
}

export const metadata = { title: "Founder Dashboard" };
