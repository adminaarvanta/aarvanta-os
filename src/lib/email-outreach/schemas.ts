import { z } from "zod";

export const emailFiltersSchema = z.object({
  tags: z
    .array(
      z.enum([
        "hot_lead",
        "vip",
        "customer",
        "prospect",
        "partner",
        "follow_up",
      ])
    )
    .optional(),
  minLeadScore: z.number().min(0).max(100).optional(),
  industries: z.array(z.string()).optional(),
  accountIds: z.array(z.string()).optional(),
  contactIds: z.array(z.string()).optional(),
});

export const createEmailCampaignSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().max(1000).optional(),
  subject: z.string().min(1).max(200),
  previewText: z.string().max(200).optional(),
  htmlBody: z.string().min(1).max(100_000),
  textBody: z.string().min(1).max(50_000),
  fromName: z.string().max(120).optional(),
  fromEmail: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  filters: emailFiltersSchema.optional(),
  dailySendLimit: z.number().int().positive().max(2000).optional(),
  scheduledAt: z.string().optional(),
  status: z
    .enum(["draft", "scheduled", "running", "paused", "completed", "cancelled"])
    .optional(),
});

export const updateEmailCampaignSchema = createEmailCampaignSchema.partial();
