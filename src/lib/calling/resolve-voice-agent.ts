import { pickPreferredVoiceAgent } from "@/lib/channels/cloned-voice";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import {
  getWorkspaceSettings,
  setWorkspaceSettings,
} from "@/lib/settings/workspace-settings";
import type { VoiceAgent } from "@/types/calling-agent";
import type { TenantScope } from "@/types/communication";

/**
 * Resolve which Voice Agent (and therefore which cloned TTS) a live call uses.
 * Explicit campaign/session ids win; otherwise the workspace primary, then
 * any agent with a custom clone, then the first agent.
 */
export async function resolveCallVoiceAgent(
  scope: TenantScope,
  opts?: { voiceAgentId?: string | null; campaignId?: string | null }
): Promise<VoiceAgent | null> {
  const calling = getCallingAgentRepository();
  const explicit = opts?.voiceAgentId?.trim();
  if (explicit) {
    const agent = await calling.getAgent(explicit, scope);
    if (agent) return agent;
  }

  const campaignId = opts?.campaignId?.trim();
  if (campaignId) {
    const campaign = await calling.getCampaign(campaignId, scope);
    if (campaign) {
      const agent = await calling.getAgent(campaign.voiceAgentId, scope);
      if (agent) return agent;
    }
  }

  const [settings, agents] = await Promise.all([
    getWorkspaceSettings(scope.workspaceId),
    calling.listAgents(scope),
  ]);
  return pickPreferredVoiceAgent(agents, settings.voicePrimaryAgentId) ?? null;
}

/** Mark a Voice Agent as the workspace default for Dialer, inbound, and scheduled calls. */
export async function setPrimaryVoiceAgent(
  workspaceId: string,
  agentId: string
): Promise<void> {
  await setWorkspaceSettings(workspaceId, { voicePrimaryAgentId: agentId });
}

/**
 * After a successful clone: promote when the user asked, or when the
 * workspace has no primary yet.
 */
export async function promoteVoiceAgentAfterClone(
  workspaceId: string,
  agentId: string,
  wantPrimary: boolean | undefined
): Promise<void> {
  if (wantPrimary === false) return;
  if (wantPrimary === true) {
    await setPrimaryVoiceAgent(workspaceId, agentId);
    return;
  }
  const settings = await getWorkspaceSettings(workspaceId);
  if (!settings.voicePrimaryAgentId?.trim()) {
    await setPrimaryVoiceAgent(workspaceId, agentId);
  }
}
