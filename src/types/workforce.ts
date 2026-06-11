import type { TenantScope } from "@/types/communication";

export type AgentType =
  | "sales"
  | "support"
  | "account_manager"
  | "operations"
  | "executive";

export type AgentRunStatus = "running" | "completed" | "failed";

export type AgentActionType =
  | "create_task"
  | "create_activity"
  | "suggest_reply"
  | "alert";

export interface AgentAction {
  id: string;
  type: AgentActionType;
  label: string;
  payload: Record<string, unknown>;
  applied?: boolean;
  appliedAt?: string;
}

export interface AgentRun extends TenantScope {
  id: string;
  agentType: AgentType;
  status: AgentRunStatus;
  trigger: "manual";
  contactId?: string;
  conversationId?: string;
  inputSummary?: string;
  summary: string;
  recommendations: string[];
  actions: AgentAction[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AgentDefinition {
  type: AgentType;
  name: string;
  tagline: string;
  responsibilities: string[];
  requiresContact?: boolean;
  requiresConversation?: boolean;
}
