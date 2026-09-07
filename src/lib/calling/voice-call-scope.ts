import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getWebhookTenantScope } from "@/lib/tenant/context";
import type { TenantScope } from "@/types/communication";

function asScope(record: TenantScope): TenantScope {
  return {
    tenantId: record.tenantId,
    workspaceId: record.workspaceId,
    companyId: record.companyId,
  };
}

/**
 * Live-call webhooks must not assume the process-wide webhook tenant.
 * Prefer the session, then the agent, then the campaign.
 */
export async function resolveVoiceCallScope(input: {
  sessionId?: string;
  voiceAgentId?: string;
  campaignId?: string;
}): Promise<TenantScope> {
  const fallback = getWebhookTenantScope();
  const calling = getCallingAgentRepository();

  const sessionId = input.sessionId?.trim();
  if (sessionId) {
    const session =
      (await calling.getSessionById(sessionId)) ??
      (await calling.getSession(sessionId, fallback));
    if (session) return asScope(session);
  }

  const voiceAgentId = input.voiceAgentId?.trim();
  if (voiceAgentId) {
    const agent =
      (await calling.getAgentById(voiceAgentId)) ??
      (await calling.getAgent(voiceAgentId, fallback));
    if (agent) return asScope(agent);
  }

  const campaignId = input.campaignId?.trim();
  if (campaignId) {
    const campaign = await calling.getCampaign(campaignId, fallback);
    if (campaign) return asScope(campaign);
  }

  return fallback;
}
