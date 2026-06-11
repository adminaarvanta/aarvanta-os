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
  listContacts(scope: TenantScope): Promise<CrmContact[]>;
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
      >
    >,
    scope: TenantScope
  ): Promise<CrmContact | null>;

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
      >
    >,
    scope: TenantScope
  ): Promise<CrmCompany | null>;

  listPipelines(scope: TenantScope): Promise<CrmPipeline[]>;
  getPipeline(id: string, scope: TenantScope): Promise<CrmPipeline | null>;

  listDeals(scope: TenantScope, pipelineId?: string): Promise<CrmDeal[]>;
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
      >
    >,
    scope: TenantScope
  ): Promise<CrmDeal | null>;

  listTasks(scope: TenantScope, filters?: { status?: TaskStatus }): Promise<CrmTask[]>;
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
      >
    >,
    scope: TenantScope
  ): Promise<CrmTask | null>;

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
  authorName?: string;
};
