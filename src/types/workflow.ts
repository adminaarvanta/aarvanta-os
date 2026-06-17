import type { TenantScope } from "@/types/communication";
import type { AgentType } from "@/types/workforce";

export type WorkflowTriggerType =
  | "manual"
  | "crm_lead_scored"
  | "deal_updated"
  | "schedule";

export type WorkflowStepType =
  | "condition"
  | "agent"
  | "approval"
  | "action"
  | "delay";

export type WorkflowRunStatus =
  | "running"
  | "completed"
  | "failed"
  | "awaiting_approval";

export type WorkflowActionType =
  | "create_task"
  | "create_activity"
  | "alert";

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  label: string;
  config?: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  label: string;
  config: Record<string, unknown>;
}

export interface Workflow extends TenantScope {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  templateId?: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStepLog {
  stepId: string;
  stepLabel: string;
  stepType: WorkflowStepType;
  status: "completed" | "skipped" | "failed" | "pending";
  output?: string;
  at: string;
}

export interface WorkflowRun extends TenantScope {
  id: string;
  workflowId: string;
  workflowName: string;
  status: WorkflowRunStatus;
  trigger: "manual" | "automation";
  context: WorkflowRunContext;
  stepLogs: WorkflowStepLog[];
  pendingApproval?: {
    stepId: string;
    stepLabel: string;
    message: string;
  };
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface WorkflowRunContext {
  contactId?: string;
  dealId?: string;
  contactName?: string;
  leadScore?: number;
  dealValue?: number;
  notes?: string;
}

export type ConditionField = "leadScore" | "dealValue";
export type ConditionOperator = "gte" | "lte" | "eq";

export interface ConditionStepConfig {
  field: ConditionField;
  operator: ConditionOperator;
  value: number;
}

export interface AgentStepConfig {
  agentType: AgentType;
}

export interface ApprovalStepConfig {
  message: string;
}

export interface ActionStepConfig {
  actionType: WorkflowActionType;
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  activityType?: "call" | "meeting" | "note";
  alertMessage?: string;
}

export interface DelayStepConfig {
  label: string;
  minutes: number;
}
