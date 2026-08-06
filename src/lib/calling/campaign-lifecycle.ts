import { resolveAudience } from "@/lib/calling/audience";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { crmNow } from "@/lib/data/crm-helpers";
import type { TenantScope } from "@/types/communication";
import type { CallCampaign } from "@/types/calling-agent";

export async function generateQueueForCampaign(
  campaign: CallCampaign,
  scope: TenantScope
) {
  const repo = getCallingAgentRepository();
  const audience = await resolveAudience(campaign.filters, scope);
  const existing = await repo.listQueue(scope, { campaignId: campaign.id });
  const existingContactIds = new Set(existing.map((q) => q.contactId));

  const toCreate = audience
    .filter((c) => !existingContactIds.has(c.id))
    .map((c, index) => ({
      campaignId: campaign.id,
      contactId: c.id,
      status: "pending" as const,
      priority: Math.max(0, (c.leadScore ?? 0) + (audience.length - index)),
      nextAttemptAt: crmNow(),
    }));

  if (!toCreate.length) return existing;
  const created = await repo.createQueueItems(toCreate, scope);
  return [...created, ...existing];
}

export async function startCampaign(campaignId: string, scope: TenantScope) {
  const repo = getCallingAgentRepository();
  const campaign = await repo.getCampaign(campaignId, scope);
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status === "cancelled" || campaign.status === "completed") {
    throw new Error(`Cannot start a ${campaign.status} campaign`);
  }

  await generateQueueForCampaign(campaign, scope);
  return repo.updateCampaign(
    campaignId,
    { status: "running", startedAt: campaign.startedAt ?? crmNow() },
    scope
  );
}

export async function pauseCampaign(campaignId: string, scope: TenantScope) {
  const repo = getCallingAgentRepository();
  return repo.updateCampaign(campaignId, { status: "paused" }, scope);
}

export async function resumeCampaign(campaignId: string, scope: TenantScope) {
  const repo = getCallingAgentRepository();
  const campaign = await repo.getCampaign(campaignId, scope);
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status !== "paused") {
    throw new Error("Only paused campaigns can be resumed");
  }
  return repo.updateCampaign(campaignId, { status: "running" }, scope);
}

export async function stopCampaign(campaignId: string, scope: TenantScope) {
  const repo = getCallingAgentRepository();
  return repo.updateCampaign(campaignId, { status: "cancelled" }, scope);
}
