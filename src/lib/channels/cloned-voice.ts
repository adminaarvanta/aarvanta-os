import type { VoiceAgent } from "@/types/calling-agent";

const DEMO_CLONE_PREFIX = "demo_";

/** Seeded catalog persona — keep on workspace TTS; clone a newly created agent instead. */
export const DEFAULT_CATALOG_AGENT_ID = "voice_agent_ava";

export function isDefaultCatalogAgent(
  agent: Pick<VoiceAgent, "id"> | null | undefined
): boolean {
  return agent?.id === DEFAULT_CATALOG_AGENT_ID;
}

/** Voice IDs that should never be sent to the EC2 relay / ElevenLabs TTS. */
export function isDemoClonedVoiceId(voiceId: string): boolean {
  return voiceId.startsWith(DEMO_CLONE_PREFIX);
}

export function demoClonedVoiceId(agentId: string): string {
  return `${DEMO_CLONE_PREFIX}${agentId}`;
}

/** UI: agent has a saved clone (including demo stubs). */
export function hasCustomVoiceSample(
  agent: VoiceAgent | null | undefined
): boolean {
  return agent?.clonedVoice?.status === "ready";
}

/**
 * Pick which agent Dialer / inbound / campaigns should default to.
 * Prefers the workspace primary, then any agent with a custom clone.
 */
export function pickPreferredVoiceAgent(
  agents: VoiceAgent[],
  primaryId?: string | null
): VoiceAgent | undefined {
  const primary = primaryId?.trim();
  if (primary) {
    const match = agents.find((a) => a.id === primary);
    if (match) return match;
  }
  return (
    agents.find((a) => Boolean(liveClonedVoiceId(a))) ??
    agents.find((a) => hasCustomVoiceSample(a)) ??
    agents[0]
  );
}

/**
 * ElevenLabs voice id to speak on live calls. Undefined when the agent has
 * no clone, the clone failed, or it is a demo stub (catalog TTS still used).
 */
export function liveClonedVoiceId(
  agent: VoiceAgent | null | undefined
): string | undefined {
  const cloned = agent?.clonedVoice;
  if (!cloned || cloned.status !== "ready") return undefined;
  const id = cloned.elevenLabsVoiceId.trim();
  if (!id || isDemoClonedVoiceId(id)) return undefined;
  return id;
}
