import type { TenantScope } from "@/types/communication";
import type { ContactTag } from "@/types/crm";

export type EmailCampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "paused"
  | "completed"
  | "cancelled";

export type EmailSendStatus =
  | "pending"
  | "sending"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "blocked"
  | "spam"
  | "unsubscribed"
  | "failed"
  | "skipped";

export interface EmailCampaignFilters {
  tags?: ContactTag[];
  minLeadScore?: number;
  industries?: string[];
  accountIds?: string[];
  contactIds?: string[];
}

export interface EmailCampaign extends TenantScope {
  id: string;
  name: string;
  description?: string;
  subject: string;
  previewText?: string;
  htmlBody: string;
  textBody: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  filters: EmailCampaignFilters;
  status: EmailCampaignStatus;
  dailySendLimit: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSendItem extends TenantScope {
  id: string;
  campaignId: string;
  contactId: string;
  toEmail: string;
  toName: string;
  status: EmailSendStatus;
  subject: string;
  attemptCount: number;
  nextAttemptAt: string;
  lastAttemptAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  brevoMessageId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export const EMAIL_MERGE_FIELDS = [
  "firstName",
  "lastName",
  "fullName",
  "email",
  "company",
  "jobTitle",
] as const;

export type EmailMergeField = (typeof EMAIL_MERGE_FIELDS)[number];
