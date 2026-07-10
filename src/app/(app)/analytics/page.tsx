import { BarChart3 } from "lucide-react";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { buildAnalyticsSnapshot } from "@/lib/analytics/build-analytics";
import { getSessionContext } from "@/lib/tenant/context";

export default async function AnalyticsPage() {
  const ctx = await getSessionContext();
  const snapshot = await buildAnalyticsSnapshot(ctx.scope, "monthly");

  return (
    <>
      <header className="shrink-0 border-b border-[#243656] bg-[#0D1524] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#FFFFFF] sm:text-xl">
          <BarChart3 className="h-5 w-5 text-[#B8965D]" />
          Analytics
        </h2>
        <p className="text-xs text-[#9AABC4] sm:text-sm">
          Revenue, pipeline, projects, tasks, AI usage — daily, weekly, monthly reports.
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <AnalyticsClient initialSnapshot={snapshot} />
      </div>
    </>
  );
}

export const metadata = { title: "Analytics" };
