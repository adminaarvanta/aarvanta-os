import { BarChart3 } from "lucide-react";
import { buildAnalyticsSnapshot } from "@/lib/analytics/build-analytics";
import {
  getAutonomousStore,
  getFinanceStore,
  getHrStore,
  getMarketplaceStore,
} from "@/lib/data/platform-store";
import { ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getTenantScope } from "@/lib/tenant/context";

function formatCurrency(value: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function AnalyticsV2Page() {
  const scope = await getTenantScope();
  const financeStore = getFinanceStore();
  const hrStore = getHrStore();
  const autonomousStore = getAutonomousStore();
  const marketplaceStore = getMarketplaceStore();

  const [snapshot, invoices, expenses, candidates, employees, autonomousTasks, installedAgents] =
    await Promise.all([
      buildAnalyticsSnapshot(scope, "monthly"),
      financeStore.list(scope),
      financeStore.listExpenses(scope),
      hrStore.list(scope),
      hrStore.listEmployees(scope),
      autonomousStore.list(scope),
      marketplaceStore.list(scope),
    ]);

  const revenueTotal = snapshot.revenue.total;
  const invoiceTotal = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <ModulePageShell
      icon={BarChart3}
      title="Analytics 2.0"
      description="Revenue, sales, operations, and AI workforce analytics in one dashboard."
    >
      <div className="space-y-8">
        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Revenue</h3>
          <StatGrid
            items={[
              { label: "Revenue total", value: formatCurrency(revenueTotal), sub: "Closed revenue" },
              {
                label: "Invoice value",
                value: formatCurrency(invoiceTotal),
                sub: `${invoices.length} invoices`,
              },
              {
                label: "Expenses",
                value: formatCurrency(expenseTotal),
                sub: `${expenses.length} expense records`,
              },
              {
                label: "Revenue change",
                value: `${snapshot.revenue.changePct}%`,
                sub: "vs prior period",
              },
            ]}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Sales</h3>
          <StatGrid
            items={[
              { label: "Won deals", value: snapshot.revenue.wonDeals, sub: "Closed opportunities" },
              {
                label: "Open deals",
                value: snapshot.pipeline.openDeals,
                sub: "Active pipeline",
              },
              {
                label: "Pipeline value",
                value: formatCurrency(snapshot.pipeline.pipelineValue),
                sub: "Current pipeline",
              },
              {
                label: "Weighted forecast",
                value: formatCurrency(snapshot.pipeline.weightedForecast),
                sub: "Probability adjusted",
              },
            ]}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Operations</h3>
          <StatGrid
            items={[
              { label: "Active projects", value: snapshot.projects.active, sub: "Delivery workload" },
              {
                label: "Overdue tasks",
                value: snapshot.projects.overdueTasks,
                sub: `${snapshot.projects.openTasks} open project tasks`,
              },
              {
                label: "Candidates",
                value: candidates.length,
                sub: "ATS funnel volume",
              },
              {
                label: "Employees",
                value: employees.length,
                sub: "Current headcount",
              },
            ]}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">AI workforce</h3>
          <StatGrid
            items={[
              {
                label: "Agent runs",
                value: snapshot.aiUsage.agentRuns,
                sub: `${snapshot.aiUsage.workflowRuns} workflow runs`,
              },
              {
                label: "Autonomous tasks",
                value: autonomousTasks.length,
                sub: `${autonomousTasks.filter((task) => task.status === "executing").length} executing`,
              },
              {
                label: "Installed agents",
                value: installedAgents.length,
                sub: "Marketplace installations",
              },
              {
                label: "Token estimate",
                value: snapshot.aiUsage.tokensEstimate.toLocaleString(),
                sub: "Monthly compute estimate",
              },
            ]}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Analytics 2.0" };
