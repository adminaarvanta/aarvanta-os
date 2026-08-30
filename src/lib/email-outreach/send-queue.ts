import { consumeEmailSend } from "@/lib/billing/consume";
import {
  isBrevoConfigured,
  sendBrevoTransactional,
} from "@/lib/channels/brevo-client";
import { crmNow } from "@/lib/data/crm-helpers";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getEmailOutreachRepository } from "@/lib/data/email-outreach-store";
import type { EmailSendItem } from "@/types/email-outreach";
import { resolveEmailAudience } from "@/lib/email-outreach/audience";
import {
  applyMergeFields,
  mergeContextFromContact,
  wrapEmailHtml,
} from "@/lib/email-outreach/personalize";

export type SendQueueResult = {
  id: string;
  ok: boolean;
  simulated?: boolean;
  error?: string;
};

function countSentToday(items: EmailSendItem[], campaignId: string): number {
  const today = new Date().toISOString().slice(0, 10);
  return items.filter(
    (item) =>
      item.campaignId === campaignId &&
      item.sentAt &&
      item.sentAt.slice(0, 10) === today &&
      item.status !== "failed" &&
      item.status !== "skipped"
  ).length;
}

async function maybeCompleteCampaign(campaignId: string, scope: EmailSendItem) {
  const repo = getEmailOutreachRepository();
  const remaining = await repo.listQueue(
    {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      companyId: scope.companyId,
    },
    { campaignId, status: "pending" }
  );
  if (remaining.length === 0) {
    await repo.updateCampaign(
      campaignId,
      { status: "completed", completedAt: crmNow() },
      {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        companyId: scope.companyId,
      }
    );
  }
}

export async function processEmailSendQueue(
  limit = 15
): Promise<SendQueueResult[]> {
  const repo = getEmailOutreachRepository();
  const due = await repo.listDueQueueItems(crmNow(), limit);
  const results: SendQueueResult[] = [];
  const sentTodayByCampaign = new Map<string, number>();

  for (const item of due) {
    const scope = {
      tenantId: item.tenantId,
      workspaceId: item.workspaceId,
      companyId: item.companyId,
    };
    const campaign = await repo.getCampaign(item.campaignId, scope);
    if (!campaign || campaign.status !== "running") {
      results.push({ id: item.id, ok: false, error: "Campaign not running" });
      continue;
    }

    if (!sentTodayByCampaign.has(campaign.id)) {
      const all = await repo.listQueue(scope, { campaignId: campaign.id });
      sentTodayByCampaign.set(campaign.id, countSentToday(all, campaign.id));
    }
    const sentToday = sentTodayByCampaign.get(campaign.id) ?? 0;
    if (sentToday >= campaign.dailySendLimit) {
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(6, 0, 0, 0);
      await repo.updateQueueItem(item.id, {
        nextAttemptAt: tomorrow.toISOString(),
      });
      results.push({
        id: item.id,
        ok: false,
        error: "Daily send limit reached",
      });
      continue;
    }

    await repo.updateQueueItem(item.id, {
      status: "sending",
      lastAttemptAt: crmNow(),
      attemptCount: item.attemptCount + 1,
    });

    const contacts = await resolveEmailAudience(
      { contactIds: [item.contactId] },
      scope
    );
    const contact =
      contacts[0] ??
      (await getCrmRepository().getContact(item.contactId, scope));
    const ctx = mergeContextFromContact({
      firstName: contact && "firstName" in contact ? contact.firstName : item.toName,
      lastName: contact && "lastName" in contact ? contact.lastName : "",
      email: item.toEmail,
      jobTitle: contact && "jobTitle" in contact ? contact.jobTitle : undefined,
      companyName:
        contact && "companyName" in contact ? contact.companyName : undefined,
    });
    const subject = applyMergeFields(campaign.subject, ctx);
    const text = applyMergeFields(campaign.textBody, ctx);
    const html = wrapEmailHtml(applyMergeFields(campaign.htmlBody, ctx));
    const simulate = !isBrevoConfigured();

    try {
      if (!simulate) {
        await consumeEmailSend(scope, 1);
      }
      let messageId: string;
      if (simulate) {
        messageId = `sim_${item.id}`;
      } else {
        const sent = await sendBrevoTransactional({
          toEmail: item.toEmail,
          toName: item.toName,
          subject,
          html,
          text,
          fromEmail: campaign.fromEmail,
          fromName: campaign.fromName,
          replyTo: campaign.replyTo,
          tags: ["aarvanta-outreach", campaign.id],
        });
        messageId = sent.messageId;
      }

      const now = crmNow();
      await repo.updateQueueItem(item.id, {
        status: simulate ? "delivered" : "sent",
        subject,
        sentAt: now,
        deliveredAt: simulate ? now : undefined,
        brevoMessageId: messageId,
        error: undefined,
      });
      sentTodayByCampaign.set(campaign.id, sentToday + 1);
      await maybeCompleteCampaign(campaign.id, item);
      results.push({ id: item.id, ok: true, simulated: simulate });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Send failed";
      await repo.updateQueueItem(item.id, {
        status: "failed",
        error: message,
      });
      results.push({ id: item.id, ok: false, error: message });
    }
  }

  return results;
}
