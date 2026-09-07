import { pickPreferredVoiceAgent } from "@/lib/channels/cloned-voice";
import {
  canViewVoiceAgent,
  filterVoiceAgentsForUser,
} from "@/lib/calling/voice-agent-access";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import type { VoiceAgent } from "@/types/calling-agent";
import type { TenantScope } from "@/types/communication";

/**
 * Resolve which Voice Agent (and therefore which cloned TTS) a live call uses.
 * Explicit campaign/session ids win; otherwise this user's primary, then
 * any of their agents with a custom clone.
 */
export async function resolveCallVoiceAgent(
  scope: TenantScope,
  opts?: {
    voiceAgentId?: string | null;
    campaignId?: string | null;
    ownerUserId?: string | null;
  }
): Promise<VoiceAgent | null> {
  const calling = getCallingAgentRepository();
  const explicit = opts?.voiceAgentId?.trim();
  if (explicit) {
    const agent =
      (await calling.getAgent(explicit, scope)) ??
      (await calling.getAgentById(explicit));
    if (agent) return agent;
  }

  const campaignId = opts?.campaignId?.trim();
  if (campaignId) {
    const campaign = await calling.getCampaign(campaignId, scope);
    if (campaign) {
      const agent =
        (await calling.getAgent(campaign.voiceAgentId, scope)) ??
        (await calling.getAgentById(campaign.voiceAgentId));
      if (agent) return agent;
    }
  }

  const all = await calling.listAgents(scope);
  const visible = opts?.ownerUserId
    ? filterVoiceAgentsForUser(all, opts.ownerUserId)
    : all.filter((agent) => canViewVoiceAgent(agent, undefined));
  const primaryId = opts?.ownerUserId
    ? await getUserPrimaryAgentId(scope, opts.ownerUserId)
    : undefined;
  return pickPreferredVoiceAgent(visible, primaryId) ?? null;
}

export async function getUserPrimaryAgentId(
  scope: TenantScope,
  userId: string
): Promise<string | undefined> {
  const member = await getTenantRepository().getMemberByUser(userId, scope);
  return member?.voicePrimaryAgentId?.trim() || undefined;
}

export async function listVoiceAgentsForUser(
  scope: TenantScope,
  userId: string
): Promise<VoiceAgent[]> {
  const agents = await getCallingAgentRepository().listAgents(scope);
  return filterVoiceAgentsForUser(agents, userId);
}

/** Mark a Voice Agent as this user's default for Dialer, inbound, and scheduled calls. */
export async function setPrimaryVoiceAgent(
  scope: TenantScope,
  userId: string,
  agentId: string
): Promise<void> {
  const repo = getTenantRepository();
  const member = await repo.getMemberByUser(userId, scope);
  if (!member) {
    throw new Error("Membership not found");
  }
  await repo.updateMemberPreferences(
    member.id,
    { voicePrimaryAgentId: agentId },
    scope
  );
}

/**
 * After a successful clone: promote when the user asked, or when they
 * have no primary yet.
 */
export async function promoteVoiceAgentAfterClone(
  scope: TenantScope,
  userId: string,
  agentId: string,
  wantPrimary: boolean | undefined
): Promise<void> {
  if (wantPrimary === false) return;
  if (wantPrimary === true) {
    await setPrimaryVoiceAgent(scope, userId, agentId);
    return;
  }
  const existing = await getUserPrimaryAgentId(scope, userId);
  if (!existing) {
    await setPrimaryVoiceAgent(scope, userId, agentId);
  }
}
