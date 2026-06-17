export type ReportPeriod = "daily" | "weekly" | "monthly";

export type ExportFormat = "csv" | "pdf" | "excel";

export interface AnalyticsMetric {
  label: string;
  value: number | string;
  changePct?: number;
  unit?: string;
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
  };
  aiUsage: {
    agentRuns: number;
    workflowRuns: number;
    knowledgeQueries: number;
    tokensEstimate: number;
  };
  metrics: AnalyticsMetric[];
}

export interface AnalyticsReport {
  id: string;
  period: ReportPeriod;
  title: string;
  snapshot: AnalyticsSnapshot;
  createdAt: string;
}
