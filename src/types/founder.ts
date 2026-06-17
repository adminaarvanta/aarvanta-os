import type { TenantScope } from "@/types/communication";

export interface FounderSnapshot {
  generatedAt: string;
  revenue: {
    pipelineValue: number;
    weightedForecast: number;
    openDeals: number;
    currency: string;
  };
  sales: {
    hotLeads: number;
    totalContacts: number;
    topOpportunities: Array<{ title: string; value: number; contact?: string }>;
  };
  inbox: {
    totalConversations: number;
    urgentCount: number;
    unreadEstimate: number;
  };
  projects: {
    active: number;
    openTasks: number;
    overdueTasks: number;
  };
  knowledge: {
    documentCount: number;
    readyDocuments: number;
  };
  workforce: {
    recentRuns: number;
    pendingWorkflowApprovals: number;
  };
  focus: string[];
}

export interface FounderChatMessage extends TenantScope {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface FounderCopilotResult {
  answer: string;
  method: "rag" | "heuristic";
  suggestedActions?: string[];
}

export type FounderCommandId =
  | "open_dashboard"
  | "open_inbox"
  | "open_crm"
  | "open_leads"
  | "open_pipelines"
  | "open_workforce"
  | "open_knowledge"
  | "open_projects"
  | "open_workflows"
  | "open_team"
  | "open_integrations"
  | "open_communications"
  | "open_analytics"
  | "open_settings";

export interface FounderCommand {
  id: FounderCommandId;
  label: string;
  keywords: string[];
  href: string;
  group: "Navigate" | "Quick actions";
}
