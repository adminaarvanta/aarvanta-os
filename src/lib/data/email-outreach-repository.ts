import type { TenantScope } from "@/types/communication";
import type {
  EmailCampaign,
  EmailCampaignFilters,
  EmailCampaignStatus,
  EmailSendItem,
  EmailSendStatus,
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
