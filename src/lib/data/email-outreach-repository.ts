import type { TenantScope } from "@/types/communication";
import type {
  EmailCampaign,
  EmailCampaignFilters,
  EmailCampaignStatus,
  EmailOutreachTemplate,
  EmailSendItem,
  EmailSendStatus,
  EmailTemplateSource,
} from "@/types/email-outreach";

export type CreateEmailCampaignInput = {
  name: string;
  description?: string;
  subject: string;
  previewText?: string;
  htmlBody: string;
  textBody: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  filters?: EmailCampaignFilters;
  dailySendLimit?: number;
  scheduledAt?: string;
  status?: EmailCampaignStatus;
  createdBy?: string;
};

export type CreateEmailSendItemInput = {
  campaignId: string;
  contactId: string;
  toEmail: string;
  toName: string;
  subject: string;
  status?: EmailSendStatus;
  nextAttemptAt?: string;
};

export type CreateEmailOutreachTemplateInput = {
  name: string;
  description?: string;
  subject: string;
  previewText?: string;
  htmlBody: string;
  textBody: string;
  source?: Exclude<EmailTemplateSource, "starter">;
  createdBy?: string;
};

export interface EmailOutreachRepository {
  listCampaigns(scope: TenantScope): Promise<EmailCampaign[]>;
  getCampaign(id: string, scope: TenantScope): Promise<EmailCampaign | null>;
  createCampaign(
    input: CreateEmailCampaignInput,
    scope: TenantScope
  ): Promise<EmailCampaign>;
  updateCampaign(
    id: string,
    patch: Partial<
      Pick<
        EmailCampaign,
        | "name"
        | "description"
        | "subject"
        | "previewText"
        | "htmlBody"
        | "textBody"
        | "fromName"
        | "fromEmail"
        | "replyTo"
        | "filters"
        | "status"
        | "dailySendLimit"
        | "scheduledAt"
        | "startedAt"
        | "completedAt"
      >
    >,
    scope: TenantScope
  ): Promise<EmailCampaign | null>;

  listTemplates(scope: TenantScope): Promise<EmailOutreachTemplate[]>;
  getTemplate(
    id: string,
    scope: TenantScope
  ): Promise<EmailOutreachTemplate | null>;
  createTemplate(
    input: CreateEmailOutreachTemplateInput,
    scope: TenantScope
  ): Promise<EmailOutreachTemplate>;
  deleteTemplate(id: string, scope: TenantScope): Promise<boolean>;

  listQueue(
    scope: TenantScope,
    filters?: { campaignId?: string; status?: EmailSendStatus }
  ): Promise<EmailSendItem[]>;
  getQueueItem(id: string, scope: TenantScope): Promise<EmailSendItem | null>;
  getQueueItemByMessageId(messageId: string): Promise<EmailSendItem | null>;
  createQueueItems(
    inputs: CreateEmailSendItemInput[],
    scope: TenantScope
  ): Promise<EmailSendItem[]>;
  updateQueueItem(
    id: string,
    patch: Partial<
      Pick<
        EmailSendItem,
        | "status"
        | "attemptCount"
        | "nextAttemptAt"
        | "lastAttemptAt"
        | "sentAt"
        | "deliveredAt"
        | "openedAt"
        | "clickedAt"
        | "brevoMessageId"
        | "error"
        | "subject"
      >
    >,
    scope?: TenantScope
  ): Promise<EmailSendItem | null>;
  listDueQueueItems(nowIso: string, limit?: number): Promise<EmailSendItem[]>;
}
