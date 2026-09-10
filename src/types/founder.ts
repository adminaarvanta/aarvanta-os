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
    recentActivity: Array<{ id: string; title: string; time: string }>;
  };
  focus: string[];
}

export type TodayAttentionItem = {
  id: string;
  title: string;
  reason: string;
  href: string;
  actionLabel: string;
};

export type TodayApprovalItem = {
  id: string;
  title: string;
  reason: string;
  href: string;
  consequence: string;
};

export type TodayRecommendedAction = {
  id: string;
  title: string;
  reason: string;
  expectedOutcome: string;
  href: string;
};

export type TodayEventItem = {
  id: string;
  title: string;
  href: string;
  time: string;
};

export interface TodaySnapshot extends FounderSnapshot {
  attention: TodayAttentionItem[];
  approvals: TodayApprovalItem[];
  recommended: TodayRecommendedAction[];
  recentEvents: TodayEventItem[];
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
  | "open_voice"
  | "open_crm"
  | "open_leads"
  | "open_pipelines"
  | "open_workforce"
  | "open_knowledge"
  | "open_workflows"
  | "open_team"
  | "open_integrations"
  | "open_communications"
  | "open_analytics"
  | "open_settings"
  | "open_partners"
  | "open_platform"
  | "open_billing"
  | "open_writing"
  | "open_hr"
  | "open_marketplace"
  | "open_platform_coverage"
  | "run_demo"
  | "create_lead"
  | "generate_proposal";

export interface FounderCommand {
  id: FounderCommandId;
  label: string;
  keywords: string[];
  href: string;
  group: "Navigate" | "Quick actions";
}
