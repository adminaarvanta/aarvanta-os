import { contactDisplayName } from "@/types/crm";
import { crmNow } from "@/lib/data/crm-helpers";
import { getEmailOutreachRepository } from "@/lib/data/email-outreach-store";
import type { TenantScope } from "@/types/communication";
import type { EmailCampaign } from "@/types/email-outreach";
import { resolveEmailAudience } from "@/lib/email-outreach/audience";
import { applyMergeFields, mergeContextFromContact } from "@/lib/email-outreach/personalize";
import { processEmailSendQueue } from "@/lib/email-outreach/send-queue";

async function generateQueueForCampaign(
  campaign: EmailCampaign,
  scope: TenantScope
) {
  const repo = getEmailOutreachRepository();
  const audience = await resolveEmailAudience(campaign.filters, scope);
  const existing = await repo.listQueue(scope, { campaignId: campaign.id });
  const already = new Set(existing.map((item) => item.contactId));
  const now = crmNow();

  const inputs = audience
    .filter((contact) => !already.has(contact.id) && contact.email?.trim())
    .map((contact) => ({
      campaignId: campaign.id,
      contactId: contact.id,
      toEmail: contact.email!.trim(),
      toName: contactDisplayName(contact),
      subject: applyMergeFields(
        campaign.subject,
        mergeContextFromContact(contact)
      ),
      nextAttemptAt: now,
    }));

  if (inputs.length) {
    await repo.createQueueItems(inputs, scope);
  }
  return inputs.length;
}

export async function startEmailCampaign(
  campaignId: string,
  scope: TenantScope
) {
  const repo = getEmailOutreachRepository();
  const campaign = await repo.getCampaign(campaignId, scope);
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status === "cancelled" || campaign.status === "completed") {
    throw new Error(`Cannot start a ${campaign.status} campaign`);
  }

  await generateQueueForCampaign(campaign, scope);
  const updated = await repo.updateCampaign(
    campaignId,
    { status: "running", startedAt: campaign.startedAt ?? crmNow() },
    scope
  );
  await processEmailSendQueue(Math.min(campaign.dailySendLimit, 15));
  return updated;
}

export async function pauseEmailCampaign(
  campaignId: string,
  scope: TenantScope
) {
  const repo = getEmailOutreachRepository();
  return repo.updateCampaign(campaignId, { status: "paused" }, scope);
}

export async function resumeEmailCampaign(
  campaignId: string,
  scope: TenantScope
) {
  const repo = getEmailOutreachRepository();
  const campaign = await repo.getCampaign(campaignId, scope);
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status !== "paused") {
    throw new Error("Only paused campaigns can be resumed");
  }
  const updated = await repo.updateCampaign(
    campaignId,
    { status: "running" },
    scope
  );
  await processEmailSendQueue(Math.min(campaign.dailySendLimit, 15));
  return updated;
}

export async function stopEmailCampaign(
  campaignId: string,
  scope: TenantScope
) {
  const repo = getEmailOutreachRepository();
  return repo.updateCampaign(campaignId, { status: "cancelled" }, scope);
}
