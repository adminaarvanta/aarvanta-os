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
  | "update_deal"
  | "suggest_reply"
  | "alert"
  | "generate_hr_document";

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
  trigger: "manual" | "task" | "autonomous";
  contactId?: string;
  conversationId?: string;
  taskId?: string;
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

// ─── Goal-first pipeline ───────────────────────────────────────────

export type GoalObjective =
  | "close_lead"
  | "follow_up"
  | "recover_customer"
  | "book_meeting"
  | "generate_proposal"
  | "custom";

export type GoalPriority = "low" | "medium" | "high";

export type BusinessModuleHint =
  | "crm"
  | "hr"
  | "finance"
  | "marketing"
  | "communications"
  | "operations";

export type WorkforceGoalStatus = "created" | "active" | "completed" | "cancelled";

export interface WorkforceGoal extends TenantScope {
  id: string;
  objective: GoalObjective;
  customObjective?: string;
  priority: GoalPriority;
  deadlineHours: number;
  expectedOutcome: string;
  relatedContactId?: string;
  relatedDealId?: string;
  relatedConversationId?: string;
  moduleHint: BusinessModuleHint;
  instructions?: string;
  status: WorkforceGoalStatus;
  createdAt: string;
  completedAt?: string;
}

export type PlanStepStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped"
  | "failed"
  | "awaiting_approval";

export interface TaskPlanStep {
  id: string;
  title: string;
  status: PlanStepStatus;
  assignedAgentType?: AgentType;
  toolHint?: string;
  requiresApproval?: boolean;
  completedAt?: string;
  resultSummary?: string;
}

export interface TaskPlan {
  steps: TaskPlanStep[];
  createdAt: string;
}

export interface ContextPackage extends TenantScope {
  id: string;
  goalId: string;
  contactId?: string;
  dealId?: string;
  conversationId?: string;
  summary: string;
  fields: Record<string, unknown>;
  createdAt: string;
}

export type WorkforceExecutionStatus =
  | "created"
  | "planning"
  | "collecting_context"
  | "executing"
  | "awaiting_approval"
  | "completed"
  | "failed";

export type TimelineActorKind = "agent" | "human" | "system";

export interface TimelineEvent {
  id: string;
  at: string;
  actorKind: TimelineActorKind;
  actorId?: string;
  actorLabel: string;
  label: string;
  payload?: Record<string, unknown>;
}

export type ApprovalResolution = "approved" | "rejected" | "modified";

export type WorkforceApprovalStatus = "pending" | "resolved";

export interface WorkforceApproval extends TenantScope {
  id: string;
  executionId: string;
  stepId: string;
  reason: string;
  proposedAction: string;
  currentOffer?: string;
  requestedOffer?: string;
  dealValue?: number;
  marginImpact?: string;
  status: WorkforceApprovalStatus;
  resolution?: ApprovalResolution;
  modifiedOffer?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface WorkforceReport extends TenantScope {
  id: string;
  executionId: string;
  goalId: string;
  objectiveLabel: string;
  outcome: string;
  agentsInvolved: AgentType[];
  actionsPerformed: string[];
  messagesSent: number;
  callsMade: number;
  documentsGenerated: number;
  humanDecisions: string[];
  suggestions: string[];
  learning: string[];
  totalMinutes: number;
  createdAt: string;
}

export interface WorkforceExecution extends TenantScope {
  id: string;
  goalId: string;
  status: WorkforceExecutionStatus;
  plan: TaskPlan;
  contextPackageId?: string;
  assignedAgents: AgentType[];
  monitoringAgents: AgentType[];
  timeline: TimelineEvent[];
  approvalIds: string[];
  reportId?: string;
  crmTaskId?: string;
  agentRunIds: string[];
  error?: string;
  estimatedMinutesMin: number;
  estimatedMinutesMax: number;
  /** Accumulated tool/action summaries across the run (survives approval pauses). */
  actionsPerformed: string[];
  humanDecisions: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export type AgentLiveStatus = "working" | "waiting" | "offline";

export interface AgentOperationalStatus {
  agentType: AgentType;
  status: AgentLiveStatus;
  openExecutionIds: string[];
  lastRunAt?: string;
}

export interface AgentPerformance {
  agentType: AgentType;
  completedRuns: number;
  failedRuns: number;
  successRate: number;
  avgDurationMs: number;
  /** 0–100 efficiency score for directory cards */
  efficiency: number;
}
