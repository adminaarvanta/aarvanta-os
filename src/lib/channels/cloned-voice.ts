import type { VoiceAgent } from "@/types/calling-agent";

const DEMO_CLONE_PREFIX = "demo_";

/** Voice IDs that should never be sent to the EC2 relay / ElevenLabs TTS. */
export function isDemoClonedVoiceId(voiceId: string): boolean {
  return voiceId.startsWith(DEMO_CLONE_PREFIX);
}

export function demoClonedVoiceId(agentId: string): string {
  return `${DEMO_CLONE_PREFIX}${agentId}`;
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
