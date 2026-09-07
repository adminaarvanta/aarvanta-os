import {
  isDefaultCatalogAgent,
  liveClonedVoiceId,
} from "@/lib/channels/cloned-voice";
import type { VoiceAgent } from "@/types/calling-agent";

/** Catalog Ava (no live clone) is a shared template. Custom agents are private. */
export function canViewVoiceAgent(
  agent: VoiceAgent,
  userId: string | undefined
): boolean {
  if (!userId) return true;
  if (agent.ownerUserId && agent.ownerUserId === userId) return true;
  if (!agent.ownerUserId) return true;
  if (isDefaultCatalogAgent(agent) && !liveClonedVoiceId(agent)) return true;
  return false;
}

export function canMutateVoiceAgent(
  agent: VoiceAgent,
  userId: string | undefined
): boolean {
  if (!userId) return false;
  if (agent.ownerUserId === userId) return true;
  if (!agent.ownerUserId && !isDefaultCatalogAgent(agent)) return true;
  return false;
}

export function filterVoiceAgentsForUser(
  agents: VoiceAgent[],
  userId: string | undefined
): VoiceAgent[] {
  if (!userId) return agents;
  return agents.filter((agent) => canViewVoiceAgent(agent, userId));
}
