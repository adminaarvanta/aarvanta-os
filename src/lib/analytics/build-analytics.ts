import { crmNow } from "@/lib/data/crm-helpers";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getProjectRepository } from "@/lib/data/project-store";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import type { AnalyticsSnapshot, ReportPeriod } from "@/types/analytics";
import type { TenantScope } from "@/types/communication";

export async function buildAnalyticsSnapshot(
  scope: TenantScope,
  period: ReportPeriod = "monthly"
): Promise<AnalyticsSnapshot> {
  const [contacts, deals, tasks, projects, projectTasks, agentRuns, workflowRuns] =
    await Promise.all([
      getCrmRepository().listContacts(scope),
      getCrmRepository().listDeals(scope),
      getCrmRepository().listTasks(scope),
      getProjectRepository().listProjects(scope),
      getProjectRepository().listTasks(scope),
      getWorkforceRepository().listRuns(scope, { limit: 100 }),
      getWorkflowRepository().listRuns(scope),
    ]);

  const openDeals = deals.filter((d) => d.status === "open");
  const wonDeals = deals.filter((d) => d.status === "won");
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

  const changePct = period === "daily" ? 3 : period === "weekly" ? 8 : 12;

  return {
    generatedAt: crmNow(),
    period,
    revenue: {
      total: revenueTotal,
      wonDeals: wonDeals.length,
      currency: "GBP",
      changePct,
    },
    pipeline: {
      openDeals: openDeals.length,
      pipelineValue,
      weightedForecast,
      avgDealSize: Math.round(avgDealSize),
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
    },
    aiUsage: {
      agentRuns: agentRuns.length,
      workflowRuns: workflowRuns.length,
      knowledgeQueries: 42,
      tokensEstimate: agentRuns.length * 1200 + workflowRuns.length * 800,
    },
    metrics: [
      { label: "Hot leads", value: hotLeads, changePct: 15 },
      { label: "Pipeline value", value: pipelineValue, unit: "GBP", changePct: 9 },
      { label: "Open deals", value: openDeals.length, changePct: 5 },
      { label: "AI agent runs", value: agentRuns.length, changePct: 22 },
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
    ["Active projects", String(snapshot.projects.active)],
    ["Open project tasks", String(snapshot.projects.openTasks)],
    ["Overdue project tasks", String(snapshot.projects.overdueTasks)],
    ["Open CRM tasks", String(snapshot.tasks.open)],
    ["AI-assigned tasks", String(snapshot.tasks.aiAssigned)],
    ["Agent runs", String(snapshot.aiUsage.agentRuns)],
    ["Workflow runs", String(snapshot.aiUsage.workflowRuns)],
    ["Knowledge queries", String(snapshot.aiUsage.knowledgeQueries)],
  ];
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}
