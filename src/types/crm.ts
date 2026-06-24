import type { TenantScope } from "@/types/communication";

export type ContactTag =
  | "hot_lead"
  | "vip"
  | "customer"
  | "prospect"
  | "partner"
  | "follow_up";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type TaskSource = "manual" | "ai";
export type DealStatus = "open" | "won" | "lost";
export type ActivityType = "call" | "meeting" | "note";

export interface Purchase {
  id: string;
  label: string;
  amount: number;
  currency: string;
  purchasedAt: string;
}

export interface CrmCompany extends TenantScope {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  website?: string;
  address?: string;
  tags: ContactTag[];
  purchaseTotal: number;
  currency: string;
  notes?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmContact extends TenantScope {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  accountId?: string;
  tags: ContactTag[];
  leadScore?: number;
  leadScoreReason?: string;
  leadScoreUpdatedAt?: string;
  purchases: Purchase[];
  purchaseTotal: number;
  currency: string;
  conversationIds: string[];
  notes?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
}

export interface CrmPipeline extends TenantScope {
  id: string;
  name: string;
  stages: PipelineStage[];
  createdAt: string;
  updatedAt: string;
}

export interface CrmDeal extends TenantScope {
  id: string;
  title: string;
  pipelineId: string;
  stageId: string;
  contactId?: string;
  accountId?: string;
  value: number;
  currency: string;
  probability: number;
  expectedCloseDate?: string;
  status: DealStatus;
  notes?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmTask extends TenantScope {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  contactId?: string;
  accountId?: string;
  dealId?: string;
  assignedTo?: string;
  assignedAgentType?: string;
  agentRunId?: string;
  source: TaskSource;
  createdAt: string;
  updatedAt: string;
}

export interface CrmActivity extends TenantScope {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  contactId?: string;
  accountId?: string;
  dealId?: string;
  occurredAt: string;
  durationMinutes?: number;
  authorId?: string;
  authorName?: string;
  createdAt: string;
}

export function contactDisplayName(c: Pick<CrmContact, "firstName" | "lastName">) {
  return `${c.firstName} ${c.lastName}`.trim();
}
