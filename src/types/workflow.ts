import type { TenantScope } from "@/types/communication";
import type { AgentType } from "@/types/workforce";
import type { ContactTag } from "@/types/crm";

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

/** BDM-useful actions — outreach, CRM updates, tasks, meetings. */
export type WorkflowActionType =
  | "create_task"
  | "create_activity"
  | "alert"
  | "tag_contact"
  | "update_lead_score"
  | "move_deal_stage"
  | "send_whatsapp"
  | "send_email"
  | "book_meeting"
  | "draft_outreach";

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
  /** Last AI / draft outreach body for later send steps */
  draftMessage?: string;
  draftSubject?: string;
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
  /** When true, apply suggested CRM actions from the agent (default true for BDM). */
  applyActions?: boolean;
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
  /** tag_contact */
  tag?: ContactTag;
  /** update_lead_score */
  leadScore?: number;
  /** move_deal_stage — match by stage name */
  stageName?: string;
  /** send_whatsapp / send_email / draft_outreach */
  messageTemplate?: string;
  emailSubject?: string;
  /** book_meeting */
  meetingTitle?: string;
  meetingNotes?: string;
}

export interface DelayStepConfig {
  label: string;
  minutes: number;
}

export const WORKFLOW_ACTION_LABELS: Record<WorkflowActionType, string> = {
  create_task: "Create follow-up task",
  create_activity: "Log CRM activity",
  alert: "Notify / alert",
  tag_contact: "Tag contact",
  update_lead_score: "Set lead score",
  move_deal_stage: "Move deal stage",
  send_whatsapp: "Send WhatsApp",
  send_email: "Send email",
  book_meeting: "Book meeting (log + task)",
  draft_outreach: "Draft outreach message",
};
