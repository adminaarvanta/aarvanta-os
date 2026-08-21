import { crmNow } from "@/lib/data/crm-helpers";
import { getCrmRepository } from "@/lib/data/crm-store";
import {
  getAutonomousStore,
  getFinanceStore,
  getHrStore,
  getMarketplaceStore,
} from "@/lib/data/platform-store";
import { getProjectRepository } from "@/lib/data/project-store";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import type {
  AnalyticsListItem,
  AnalyticsSeriesPoint,
  AnalyticsSnapshot,
  ReportPeriod,
} from "@/types/analytics";
import type { TenantScope } from "@/types/communication";
import type { CrmDeal, CrmTask } from "@/types/crm";
import type { AgentRun } from "@/types/workforce";
import type { WorkflowRun } from "@/types/workflow";

function parseDate(iso: string): Date {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function changePct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function periodWindow(period: ReportPeriod, now = new Date()): {
  start: Date;
  priorStart: Date;
  bucketCount: number;
  bucketMs: number;
} {
  const end = now.getTime();
  if (period === "daily") {
    const bucketMs = 60 * 60 * 1000;
    const bucketCount = 24;
    const start = new Date(end - bucketCount * bucketMs);
    const priorStart = new Date(start.getTime() - bucketCount * bucketMs);
    return { start, priorStart, bucketCount, bucketMs };
  }
  if (period === "weekly") {
    const bucketMs = 24 * 60 * 60 * 1000;
    const bucketCount = 7;
    const start = new Date(end - bucketCount * bucketMs);
    const priorStart = new Date(start.getTime() - bucketCount * bucketMs);
    return { start, priorStart, bucketCount, bucketMs };
  }
  const bucketMs = 7 * 24 * 60 * 60 * 1000;
  const bucketCount = 8;
  const start = new Date(end - bucketCount * bucketMs);
  const priorStart = new Date(start.getTime() - bucketCount * bucketMs);
  return { start, priorStart, bucketCount, bucketMs };
}

function bucketLabel(period: ReportPeriod, index: number, bucketStart: Date): string {
  if (period === "daily") {
    return bucketStart.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  if (period === "weekly") {
    return bucketStart.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
  }
  return `W${index + 1}`;
}

function inRange(iso: string, start: Date, end: Date): boolean {
  const t = parseDate(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

function buildSeries(
  period: ReportPeriod,
  window: ReturnType<typeof periodWindow>,
  wonDeals: CrmDeal[],
  openDeals: CrmDeal[],
  agentRuns: AgentRun[],
  workflowRuns: WorkflowRun[],
  completedTasks: CrmTask[]
): AnalyticsSeriesPoint[] {
  const now = Date.now();
  const series: AnalyticsSeriesPoint[] = [];

  for (let i = 0; i < window.bucketCount; i++) {
    const bucketStart = new Date(window.start.getTime() + i * window.bucketMs);
    const bucketEnd = new Date(
      Math.min(bucketStart.getTime() + window.bucketMs, now + 1)
    );

    const revenue = wonDeals
      .filter((d) => inRange(d.updatedAt || d.createdAt, bucketStart, bucketEnd))
      .reduce((s, d) => s + d.value, 0);

    const pipeline = openDeals
      .filter((d) => inRange(d.createdAt, bucketStart, bucketEnd))
      .reduce((s, d) => s + d.value, 0);

    const agentRunsCount = agentRuns.filter((r) =>
      inRange(r.createdAt, bucketStart, bucketEnd)
    ).length;

    const workflowRunsCount = workflowRuns.filter((r) =>
      inRange(r.createdAt, bucketStart, bucketEnd)
    ).length;

    const tasksCompleted = completedTasks.filter((t) =>
      inRange(t.updatedAt || t.createdAt, bucketStart, bucketEnd)
    ).length;

    series.push({
      label: bucketLabel(period, i, bucketStart),
      revenue,
      pipeline,
      agentRuns: agentRunsCount,
      tasksCompleted,
      workflowRuns: workflowRunsCount,
    });
  }

  return series;
}

function sparkFromSeries(values: number[]): number[] {
  if (values.length === 0) return [0];
  return values;
}

function formatMoney(n: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export async function buildAnalyticsSnapshot(
  scope: TenantScope,
  period: ReportPeriod = "monthly"
): Promise<AnalyticsSnapshot> {
  const financeStore = getFinanceStore();
  const hrStore = getHrStore();
  const autonomousStore = getAutonomousStore();
  const marketplaceStore = getMarketplaceStore();

  const [
    contacts,
    deals,
    tasks,
    pipelines,
    projects,
    projectTasks,
    agentRuns,
    workflowRuns,
    invoices,
    expenses,
    candidates,
    employees,
    autonomousTasks,
    installedAgents,
  ] = await Promise.all([
    getCrmRepository().listContacts(scope),
    getCrmRepository().listDeals(scope),
    getCrmRepository().listTasks(scope),
    getCrmRepository().listPipelines(scope),
    getProjectRepository().listProjects(scope),
    getProjectRepository().listTasks(scope),
    getWorkforceRepository().listRuns(scope, { limit: 100 }),
    getWorkflowRepository().listRuns(scope),
    financeStore.list(scope),
    financeStore.listExpenses(scope),
    hrStore.list(scope),
    hrStore.listEmployees(scope),
    autonomousStore.list(scope),
    marketplaceStore.list(scope),
  ]);

  const window = periodWindow(period);
  const periodEnd = new Date();

  const openDeals = deals.filter((d) => d.status === "open");
  const wonDeals = deals.filter((d) => d.status === "won");
  const lostDeals = deals.filter((d) => d.status === "lost");

  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
  const weightedForecast = openDeals.reduce(
    (s, d) => s + d.value * (d.probability / 100),
    0
  );
  const revenueTotal = wonDeals.reduce((s, d) => s + d.value, 0);
  const avgDealSize =
    openDeals.length > 0 ? pipelineValue / openDeals.length : 0;

  const today = new Date().toISOString().slice(0, 10);
  const openProjectTasks = projectTasks.filter((t) => t.status !== "done");
  const overdueProjectTasks = openProjectTasks.filter(
    (t) => t.dueDate && t.dueDate < today
  );
  const completedProjectTasks = projectTasks.filter((t) => t.status === "done");

  const openTasks = tasks.filter((t) => t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "done");
  const aiAssigned = tasks.filter((t) => t.assignedAgentType);

  const hotLeads = contacts.filter((c) => (c.leadScore ?? 0) >= 70).length;

  // Period vs prior period deltas from dated records
  const wonInPeriod = wonDeals.filter((d) =>
    inRange(d.updatedAt || d.createdAt, window.start, periodEnd)
  );
  const wonInPrior = wonDeals.filter((d) =>
    inRange(d.updatedAt || d.createdAt, window.priorStart, window.start)
  );
  const revenuePeriod = wonInPeriod.reduce((s, d) => s + d.value, 0);
  const revenuePrior = wonInPrior.reduce((s, d) => s + d.value, 0);

  const openCreatedPeriod = openDeals.filter((d) =>
    inRange(d.createdAt, window.start, periodEnd)
  );
  const openCreatedPrior = openDeals.filter((d) =>
    inRange(d.createdAt, window.priorStart, window.start)
  );
  const pipelinePeriod = openCreatedPeriod.reduce((s, d) => s + d.value, 0);
  const pipelinePrior = openCreatedPrior.reduce((s, d) => s + d.value, 0);

  const tasksDonePeriod = completedTasks.filter((t) =>
    inRange(t.updatedAt || t.createdAt, window.start, periodEnd)
  ).length;
  const tasksDonePrior = completedTasks.filter((t) =>
    inRange(t.updatedAt || t.createdAt, window.priorStart, window.start)
  ).length;

  const agentsPeriod = agentRuns.filter((r) =>
    inRange(r.createdAt, window.start, periodEnd)
  ).length;
  const agentsPrior = agentRuns.filter((r) =>
    inRange(r.createdAt, window.priorStart, window.start)
  ).length;

  const series = buildSeries(
    period,
    window,
    wonDeals,
    openDeals,
    agentRuns,
    workflowRuns,
    completedTasks
  );

  // Stage name map
  const stageNames = new Map<string, string>();
  for (const pipe of pipelines) {
    for (const stage of pipe.stages) {
      stageNames.set(stage.id, stage.name);
    }
  }

  const stageMap = new Map<string, { count: number; value: number }>();
  for (const deal of openDeals) {
    const name = stageNames.get(deal.stageId) ?? deal.stageId ?? "Unknown";
    const prev = stageMap.get(name) ?? { count: 0, value: 0 };
    stageMap.set(name, { count: prev.count + 1, value: prev.value + deal.value });
  }
  const pipelineByStage = [...stageMap.entries()]
    .map(([stage, v]) => ({ stage, count: v.count, value: v.value }))
    .sort((a, b) => b.value - a.value);

  const dealStatus = [
    {
      status: "Open",
      count: openDeals.length,
      value: pipelineValue,
    },
    {
      status: "Won",
      count: wonDeals.length,
      value: revenueTotal,
    },
    {
      status: "Lost",
      count: lostDeals.length,
      value: lostDeals.reduce((s, d) => s + d.value, 0),
    },
  ];

  const invoiceTotal = invoices.reduce((s, inv) => s + inv.amount, 0);
  const expenseTotal = expenses.reduce((s, exp) => s + exp.amount, 0);
  const financeNet = invoiceTotal - expenseTotal;

  const currency = deals[0]?.currency ?? "GBP";

  const topDeals: AnalyticsListItem[] = [...openDeals]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((d) => ({
      id: d.id,
      title: d.title,
      meta: stageNames.get(d.stageId) ?? d.status,
      href: `/crm/deals/${d.id}`,
      value: formatMoney(d.value, d.currency || currency),
      badge: `${d.probability}%`,
    }));

  const overdueCrm = openTasks.filter((t) => t.dueDate && t.dueDate < today);
  const overdueCombined = [
    ...overdueCrm.map((t) => ({
      id: t.id,
      title: t.title,
      meta: t.dueDate ? `Due ${t.dueDate}` : "Overdue",
      href: `/crm/tasks`,
      badge: t.priority,
    })),
    ...overdueProjectTasks.map((t) => ({
      id: t.id,
      title: t.title,
      meta: t.dueDate ? `Due ${t.dueDate}` : "Overdue",
      href: `/projects`,
      badge: "project",
    })),
  ].slice(0, 6);

  const recentAgentRuns: AnalyticsListItem[] = [...agentRuns]
    .sort((a, b) => parseDate(b.createdAt).getTime() - parseDate(a.createdAt).getTime())
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      title: r.summary?.slice(0, 80) || `${r.agentType} run`,
      meta: new Date(r.createdAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      href: `/workforce/runs/${r.id}`,
      badge: r.status,
    }));

  const revenueChange = changePct(revenuePeriod, revenuePrior);
  const pipelineChange = changePct(pipelinePeriod, pipelinePrior);
  const tasksChange = changePct(tasksDonePeriod, tasksDonePrior);
  const aiChange = changePct(agentsPeriod, agentsPrior);

  // Fall back to series adjacent-bucket delta when period has no dated activity
  const seriesRevenue = series.map((p) => p.revenue);
  const seriesPipeline = series.map((p) => p.pipeline);
  const seriesAgents = series.map((p) => p.agentRuns);
  const seriesTasks = series.map((p) => p.tasksCompleted);

  const fallbackDelta = (vals: number[]) => {
    if (vals.length < 2) return 0;
    const half = Math.floor(vals.length / 2);
    const first = vals.slice(0, half).reduce((a, b) => a + b, 0);
    const second = vals.slice(half).reduce((a, b) => a + b, 0);
    return changePct(second, first);
  };

  return {
    generatedAt: crmNow(),
    period,
    revenue: {
      total: revenueTotal,
      wonDeals: wonDeals.length,
      currency,
      changePct: revenuePeriod + revenuePrior > 0 ? revenueChange : fallbackDelta(seriesRevenue),
    },
    pipeline: {
      openDeals: openDeals.length,
      pipelineValue,
      weightedForecast,
      avgDealSize: Math.round(avgDealSize),
      changePct:
        pipelinePeriod + pipelinePrior > 0 ? pipelineChange : fallbackDelta(seriesPipeline),
    },
    projects: {
      active: projects.filter((p) => p.status !== "completed").length,
      completedTasks: completedProjectTasks.length,
      openTasks: openProjectTasks.length,
      overdueTasks: overdueProjectTasks.length,
    },
    tasks: {
      open: openTasks.length,
      completed: completedTasks.length,
      aiAssigned: aiAssigned.length,
      changePct: tasksDonePeriod + tasksDonePrior > 0 ? tasksChange : fallbackDelta(seriesTasks),
    },
    aiUsage: {
      agentRuns: agentRuns.length,
      workflowRuns: workflowRuns.length,
      knowledgeQueries: 0,
      tokensEstimate: agentRuns.length * 1200 + workflowRuns.length * 800,
      changePct: agentsPeriod + agentsPrior > 0 ? aiChange : fallbackDelta(seriesAgents),
    },
    finance: {
      invoiceTotal,
      expenseTotal,
      net: financeNet,
      invoiceCount: invoices.length,
      expenseCount: expenses.length,
    },
    hr: {
      candidates: candidates.length,
      employees: employees.length,
    },
    aiExtra: {
      autonomousTasks: autonomousTasks.length,
      installedAgents: installedAgents.length,
    },
    series,
    pipelineByStage,
    dealStatus,
    taskBreakdown: [
      { label: "Open", value: openTasks.length },
      { label: "Completed", value: completedTasks.length },
      { label: "AI-assigned", value: aiAssigned.length },
      { label: "Overdue", value: overdueCrm.length + overdueProjectTasks.length },
    ],
    sparklines: {
      revenue: sparkFromSeries(seriesRevenue),
      pipeline: sparkFromSeries(seriesPipeline),
      wonDeals: sparkFromSeries(
        series.map((_, i) =>
          wonDeals.filter((d) => {
            const bucketStart = new Date(window.start.getTime() + i * window.bucketMs);
            const bucketEnd = new Date(bucketStart.getTime() + window.bucketMs);
            return inRange(d.updatedAt || d.createdAt, bucketStart, bucketEnd);
          }).length
        )
      ),
      openTasks: sparkFromSeries(seriesTasks),
      agentRuns: sparkFromSeries(seriesAgents),
      financeNet: sparkFromSeries(
        series.map((_, i) => {
          const bucketStart = new Date(window.start.getTime() + i * window.bucketMs);
          const bucketEnd = new Date(bucketStart.getTime() + window.bucketMs);
          const invoiceSum = invoices
            .filter((inv) => inRange(inv.createdAt, bucketStart, bucketEnd))
            .reduce((s, inv) => s + inv.amount, 0);
          const expenseSum = expenses
            .filter((exp) => inRange(exp.date, bucketStart, bucketEnd))
            .reduce((s, exp) => s + exp.amount, 0);
          return invoiceSum - expenseSum;
        })
      ),
    },
    topDeals,
    overdueTasks: overdueCombined,
    recentAgentRuns,
    metrics: [
      { label: "Hot leads", value: hotLeads, changePct: revenueChange },
      {
        label: "Pipeline value",
        value: pipelineValue,
        unit: "GBP",
        changePct: pipelineChange,
      },
      { label: "Open deals", value: openDeals.length, changePct: pipelineChange },
      { label: "AI agent runs", value: agentRuns.length, changePct: aiChange },
      { label: "Employees", value: employees.length },
      { label: "Candidates", value: candidates.length },
    ],
  };
}

export function snapshotToCsv(snapshot: AnalyticsSnapshot): string {
  const rows = [
    ["Metric", "Value"],
    ["Period", snapshot.period],
    ["Generated", snapshot.generatedAt],
    ["Revenue total", String(snapshot.revenue.total)],
    ["Won deals", String(snapshot.revenue.wonDeals)],
    ["Revenue change %", String(snapshot.revenue.changePct)],
    ["Open deals", String(snapshot.pipeline.openDeals)],
    ["Pipeline value", String(snapshot.pipeline.pipelineValue)],
    ["Weighted forecast", String(snapshot.pipeline.weightedForecast)],
    ["Pipeline change %", String(snapshot.pipeline.changePct)],
    ["Active projects", String(snapshot.projects.active)],
    ["Open project tasks", String(snapshot.projects.openTasks)],
    ["Overdue project tasks", String(snapshot.projects.overdueTasks)],
    ["Open CRM tasks", String(snapshot.tasks.open)],
    ["Completed CRM tasks", String(snapshot.tasks.completed)],
    ["AI-assigned tasks", String(snapshot.tasks.aiAssigned)],
    ["Agent runs", String(snapshot.aiUsage.agentRuns)],
    ["Workflow runs", String(snapshot.aiUsage.workflowRuns)],
    ["Knowledge queries", String(snapshot.aiUsage.knowledgeQueries)],
    ["Invoice total", String(snapshot.finance.invoiceTotal)],
    ["Expense total", String(snapshot.finance.expenseTotal)],
    ["Finance net", String(snapshot.finance.net)],
    ["Candidates", String(snapshot.hr.candidates)],
    ["Employees", String(snapshot.hr.employees)],
    ["Autonomous tasks", String(snapshot.aiExtra.autonomousTasks)],
    ["Installed agents", String(snapshot.aiExtra.installedAgents)],
  ];

  for (const point of snapshot.series) {
    rows.push([
      `Series ${point.label}`,
      `revenue=${point.revenue};pipeline=${point.pipeline};agents=${point.agentRuns};tasks=${point.tasksCompleted}`,
    ]);
  }

  for (const stage of snapshot.pipelineByStage) {
    rows.push([`Stage ${stage.stage}`, `${stage.count} deals / ${stage.value}`]);
  }

  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}
