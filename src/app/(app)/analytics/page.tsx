import { BarChart3 } from "lucide-react";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { ModulePageShell } from "@/components/platform/module-page-shell";
import { buildAnalyticsSnapshot } from "@/lib/analytics/build-analytics";
import { getSessionContext } from "@/lib/tenant/context";

export default async function AnalyticsPage() {
  const ctx = await getSessionContext();
  const snapshot = await buildAnalyticsSnapshot(ctx.scope, "monthly");

  return (
    <ModulePageShell
      icon={BarChart3}
      title="Analytics"
      description="Executive dashboard — revenue, pipeline, operations, and AI workforce trends."
    >
      <AnalyticsClient initialSnapshot={snapshot} />
    </ModulePageShell>
  );
}

export const metadata = { title: "Analytics" };
