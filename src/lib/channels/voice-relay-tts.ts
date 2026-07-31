/**
 * ConversationRelay TTS provider selection.
 *
 * Defaults to ElevenLabs Sarah — warmer reception voice, billed within the same
 * ~$0.07/min Relay fee (no separate ElevenLabs account).
 *
 * Set VOICE_RELAY_TTS_PROVIDER=Amazon for the basic Polly voice.
 * Set VOICE_RELAY_BUDGET_MODE=true to skip ConversationRelay entirely (one-shot <Say> only —
 * no two-way AI, avoids the $0.07/min Relay charge). Keep budget mode OFF for human AI calls.
 *
 * Workspace Voice OS prefs override env when present — see voice-calling-config.ts.
 */
export type ConversationRelayTtsProvider = "Amazon" | "Google" | "ElevenLabs";

/** Default ElevenLabs voice — Sarah (warmer than Mark flash). */
export const DEFAULT_ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

export function isVoiceRelayBudgetMode(): boolean {
  const v = process.env.VOICE_RELAY_BUDGET_MODE?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** Env-only defaults (used when workspace prefs are unset). */
export function getConversationRelayTtsFromEnv() {
  const provider = (
    process.env.VOICE_RELAY_TTS_PROVIDER?.trim() || "ElevenLabs"
  ) as ConversationRelayTtsProvider;

  const voice =
    process.env.VOICE_RELAY_TTS_VOICE?.trim() ||
    (provider === "ElevenLabs"
      ? DEFAULT_ELEVENLABS_VOICE_ID
      : provider === "Google"
        ? "en-US-Journey-O"
        : "Joanna-Neural");

  const elevenlabsTextNormalization =
    process.env.VOICE_RELAY_ELEVENLABS_TEXT_NORM?.trim() || "on";

  return { provider, voice, elevenlabsTextNormalization };
}

/** @deprecated Prefer resolveVoiceCallingConfig — kept for callers that only need env. */
export function getConversationRelayTts() {
  return getConversationRelayTtsFromEnv();
}
