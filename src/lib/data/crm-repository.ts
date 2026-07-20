import type { TenantScope } from "@/types/communication";
import type {
  ActivityType,
  ContactTag,
  CrmActivity,
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmPipeline,
  CrmTask,
  DealStatus,
  Purchase,
  TaskPriority,
  TaskSource,
  TaskStatus,
} from "@/types/crm";

export interface CrmRepository {
  listContacts(
    scope: TenantScope,
    filters?: { accountId?: string }
  ): Promise<CrmContact[]>;
  getContact(id: string, scope: TenantScope): Promise<CrmContact | null>;
  createContact(input: CreateContactInput, scope: TenantScope): Promise<CrmContact>;
  updateContact(
    id: string,
    patch: Partial<
      Pick<
        CrmContact,
        | "firstName"
        | "lastName"
        | "email"
        | "phone"
        | "jobTitle"
        | "accountId"
        | "tags"
        | "leadScore"
        | "leadScoreReason"
        | "leadScoreUpdatedAt"
        | "purchases"
        | "purchaseTotal"
        | "conversationIds"
        | "notes"
        | "ownerId"
      >
    >,
    scope: TenantScope
  ): Promise<CrmContact | null>;
  deleteContact(id: string, scope: TenantScope): Promise<boolean>;

  listCompanies(scope: TenantScope): Promise<CrmCompany[]>;
  getCompany(id: string, scope: TenantScope): Promise<CrmCompany | null>;
  createCompany(input: CreateCompanyInput, scope: TenantScope): Promise<CrmCompany>;
  updateCompany(
    id: string,
    patch: Partial<
      Pick<
        CrmCompany,
        | "name"
        | "domain"
        | "industry"
        | "size"
        | "website"
        | "address"
        | "tags"
        | "purchaseTotal"
        | "notes"
        | "ownerId"
      >
    >,
    scope: TenantScope
  ): Promise<CrmCompany | null>;
  deleteCompany(id: string, scope: TenantScope): Promise<boolean>;

  listPipelines(scope: TenantScope): Promise<CrmPipeline[]>;
  getPipeline(id: string, scope: TenantScope): Promise<CrmPipeline | null>;
  createPipeline(input: CreatePipelineInput, scope: TenantScope): Promise<CrmPipeline>;
  updatePipeline(
    id: string,
    patch: Partial<Pick<CrmPipeline, "name" | "stages">>,
    scope: TenantScope
  ): Promise<CrmPipeline | null>;
  deletePipeline(id: string, scope: TenantScope): Promise<boolean>;

  listDeals(
    scope: TenantScope,
    filters?: { pipelineId?: string; contactId?: string; accountId?: string }
  ): Promise<CrmDeal[]>;
  getDeal(id: string, scope: TenantScope): Promise<CrmDeal | null>;
  createDeal(input: CreateDealInput, scope: TenantScope): Promise<CrmDeal>;
  updateDeal(
    id: string,
    patch: Partial<
      Pick<
        CrmDeal,
        | "title"
        | "stageId"
        | "contactId"
        | "accountId"
        | "value"
        | "probability"
        | "expectedCloseDate"
        | "status"
        | "notes"
        | "ownerId"
      >
    >,
    scope: TenantScope
  ): Promise<CrmDeal | null>;
  deleteDeal(id: string, scope: TenantScope): Promise<boolean>;

  listTasks(
    scope: TenantScope,
    filters?: {
      status?: TaskStatus;
      assignedAgentType?: string;
      assignedTo?: string;
      contactId?: string;
      dealId?: string;
    }
  ): Promise<CrmTask[]>;
  getTask(id: string, scope: TenantScope): Promise<CrmTask | null>;
  createTask(input: CreateTaskInput, scope: TenantScope): Promise<CrmTask>;
  updateTask(
    id: string,
    patch: Partial<
      Pick<
        CrmTask,
        | "title"
        | "description"
        | "status"
        | "priority"
        | "dueDate"
        | "contactId"
        | "accountId"
        | "dealId"
        | "assignedTo"
        | "assignedAgentType"
        | "agentRunId"
      >
    >,
    scope: TenantScope
  ): Promise<CrmTask | null>;
  deleteTask(id: string, scope: TenantScope): Promise<boolean>;

  listActivities(
    scope: TenantScope,
    filters?: { contactId?: string; accountId?: string; dealId?: string }
  ): Promise<CrmActivity[]>;
  createActivity(input: CreateActivityInput, scope: TenantScope): Promise<CrmActivity>;
}

export type CreateContactInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  accountId?: string;
  tags?: ContactTag[];
  purchases?: Purchase[];
  conversationIds?: string[];
  notes?: string;
  ownerId?: string;
};

export type CreateCompanyInput = {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  website?: string;
  address?: string;
  tags?: ContactTag[];
  notes?: string;
  ownerId?: string;
};

export type CreatePipelineInput = {
  name: string;
  stages?: Array<{
    id?: string;
    name: string;
    order: number;
    probability: number;
  }>;
};

export type CreateDealInput = {
  title: string;
  pipelineId: string;
  stageId: string;
  contactId?: string;
  accountId?: string;
  value: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: string;
  status?: DealStatus;
  notes?: string;
  ownerId?: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  contactId?: string;
  accountId?: string;
  dealId?: string;
  assignedTo?: string;
  assignedAgentType?: string;
  agentRunId?: string;
  source?: TaskSource;
};

export type CreateActivityInput = {
  type: ActivityType;
  title: string;
  description?: string;
  contactId?: string;
  accountId?: string;
  dealId?: string;
  occurredAt?: string;
  durationMinutes?: number;
  authorId?: string;
  authorName?: string;
};
