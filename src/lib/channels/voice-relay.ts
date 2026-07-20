/**
 * Twilio ConversationRelay WebSocket URL for two-way AI voice.
 * Prefer VOICE_RELAY_WSS_URL; else derive from ONBOARDING_SIDECAR_URL host
 * (same EC2 as aarvanta_onboarding_automation).
 */

export function getVoiceRelayWssUrl(): string | null {
  const explicit = process.env.VOICE_RELAY_WSS_URL?.trim();
  if (explicit) {
    if (!explicit.startsWith("wss://")) {
      console.warn("VOICE_RELAY_WSS_URL must start with wss://");
      return null;
    }
    return explicit.replace(/\/$/, "");
  }

  const sidecar = process.env.ONBOARDING_SIDECAR_URL?.trim();
  if (!sidecar) return null;

  try {
    const u = new URL(sidecar);
    if (!u.hostname) return null;
    return `wss://${u.host}/voice-relay/ws`;
  } catch {
    return null;
  }
}

export function isVoiceRelayConfigured(): boolean {
  return Boolean(getVoiceRelayWssUrl());
}
