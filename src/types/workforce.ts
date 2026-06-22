import type { TenantScope } from "@/types/communication";

export type AgentType =
  | "ceo"
  | "coo"
  | "sales_manager"
  | "marketing_manager"
  | "hr_manager"
  | "cfo"
  | "customer_success_manager";

export type AgentDepartment =
  | "leadership"
  | "operations"
  | "sales"
  | "marketing"
  | "hr"
  | "finance"
  | "customer_success";

export type AgentRunStatus = "running" | "completed" | "failed";

export type AgentActionType =
  | "create_task"
  | "create_activity"
  | "suggest_reply"
  | "alert";

export type AgentMemorySource = "manual" | "run" | "chat";
export type AgentMemoryCategory =
  | "insight"
  | "decision"
  | "preference"
  | "fact";

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
  title: string;
  department: AgentDepartment;
  tagline: string;
  primaryFunction: string;
  responsibilities: string[];
  requiresContact?: boolean;
  requiresConversation?: boolean;
}

export interface AgentMemoryEntry extends TenantScope {
  id: string;
  agentType: AgentType;
  category: AgentMemoryCategory;
  content: string;
  source: AgentMemorySource;
  sourceRunId?: string;
  createdAt: string;
}

export interface AgentChatMessage extends TenantScope {
  id: string;
  agentType: AgentType;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/** Cross-agent shared memory — Module 7 */
export interface SharedMemoryEntry extends TenantScope {
  id: string;
  title: string;
  content: string;
  contributedBy: AgentType[];
  tags: string[];
  sourceRunIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** Multi-agent collaboration session — Module 7 */
export type CollaborationStatus = "running" | "completed" | "failed";

export interface AgentCollaboration extends TenantScope {
  id: string;
  title: string;
  leadAgent: AgentType;
  participantAgents: AgentType[];
  status: CollaborationStatus;
  summary: string;
  insights: string[];
  assignedTaskIds: string[];
  createdAt: string;
  completedAt?: string;
}
