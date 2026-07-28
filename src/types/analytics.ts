export type ReportPeriod = "daily" | "weekly" | "monthly";

export type ExportFormat = "csv" | "pdf" | "excel";

export interface AnalyticsMetric {
  label: string;
  value: number | string;
  changePct?: number;
  unit?: string;
}

export interface AnalyticsSeriesPoint {
  label: string;
  revenue: number;
  pipeline: number;
  agentRuns: number;
  tasksCompleted: number;
  workflowRuns: number;
}

export interface AnalyticsBreakdownItem {
  stage: string;
  count: number;
  value: number;
}

export interface AnalyticsStatusItem {
  status: string;
  count: number;
  value: number;
}

export interface AnalyticsListItem {
  id: string;
  title: string;
  meta: string;
  href: string;
  value?: string;
  badge?: string;
}

export interface AnalyticsSnapshot {
  generatedAt: string;
  period: ReportPeriod;
  revenue: {
    total: number;
    wonDeals: number;
    currency: string;
    changePct: number;
  };
  pipeline: {
    openDeals: number;
    pipelineValue: number;
    weightedForecast: number;
    avgDealSize: number;
    changePct: number;
  };
  projects: {
    active: number;
    completedTasks: number;
    openTasks: number;
    overdueTasks: number;
  };
  tasks: {
    open: number;
    completed: number;
    aiAssigned: number;
    changePct: number;
  };
  aiUsage: {
    agentRuns: number;
    workflowRuns: number;
    knowledgeQueries: number;
    tokensEstimate: number;
    changePct: number;
  };
  finance: {
    invoiceTotal: number;
    expenseTotal: number;
    net: number;
    invoiceCount: number;
    expenseCount: number;
  };
  hr: {
    candidates: number;
    employees: number;
  };
  aiExtra: {
    autonomousTasks: number;
    installedAgents: number;
  };
  series: AnalyticsSeriesPoint[];
  pipelineByStage: AnalyticsBreakdownItem[];
  dealStatus: AnalyticsStatusItem[];
  taskBreakdown: { label: string; value: number }[];
  sparklines: {
    revenue: number[];
    pipeline: number[];
    wonDeals: number[];
    openTasks: number[];
    agentRuns: number[];
    financeNet: number[];
  };
  topDeals: AnalyticsListItem[];
  overdueTasks: AnalyticsListItem[];
  recentAgentRuns: AnalyticsListItem[];
  metrics: AnalyticsMetric[];
}

export interface AnalyticsReport {
  id: string;
  period: ReportPeriod;
  title: string;
  snapshot: AnalyticsSnapshot;
  createdAt: string;
}
