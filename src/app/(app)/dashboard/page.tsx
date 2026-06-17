import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { FounderCopilotPanel } from "@/components/founder/founder-copilot-panel";
import { FounderStatsGrid } from "@/components/founder/founder-stats-grid";
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
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#F5E6C8] sm:text-xl">
              <LayoutDashboard className="h-5 w-5 text-[#D4AF37]" />
              Founder Dashboard
            </h2>
            <p className="text-xs text-[#A89878] sm:text-sm">
              Command center — revenue, pipeline, projects, AI workforce, and Copilot.
            </p>
          </div>
          <p className="text-[10px] text-[#A89878]">
            Press{" "}
            <kbd className="rounded border border-[#3d3528] px-1.5 py-0.5 text-[#D4AF37]">
              ⌘K
            </kbd>{" "}
            for command bar
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 sm:p-6">
        <section>
          <h3 className="mb-4 text-sm font-semibold text-[#F5E6C8]">Business pulse</h3>
          <FounderStatsGrid snapshot={snapshot} />
        </section>

        <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
          <h3 className="text-sm font-semibold text-[#F5E6C8]">Today&apos;s focus</h3>
          <ul className="mt-3 space-y-2">
            {snapshot.focus.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-[#A89878]">
                <span className="text-[#D4AF37]">→</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {snapshot.sales.topOpportunities.length > 0 && (
          <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F5E6C8]">Top opportunities</h3>
              <Link href="/crm/pipelines" className="text-xs text-[#D4AF37] hover:underline">
                View pipeline →
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {snapshot.sales.topOpportunities.map((deal) => (
                <li
                  key={deal.title}
                  className="flex justify-between rounded-lg border border-[#3d3528] px-3 py-2 text-sm"
                >
                  <span className="text-[#F5E6C8]">
                    {deal.title}
                    {deal.contact && (
                      <span className="text-[#A89878]"> · {deal.contact}</span>
                    )}
                  </span>
                  <span className="font-medium text-[#D4AF37]">
                    £{deal.value.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <FounderCopilotPanel initialMessages={messages} />
      </div>
    </>
  );
}

export const metadata = { title: "Founder Dashboard" };
