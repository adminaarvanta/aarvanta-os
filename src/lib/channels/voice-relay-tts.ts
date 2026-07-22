/**
 * ConversationRelay TTS provider selection.
 *
 * Defaults to Amazon Polly Neural — Twilio's standard/low-cost voice path
 * (no premium ElevenLabs voice). Conversation Relay itself is still ~$0.07/min.
 *
 * Set VOICE_RELAY_TTS_PROVIDER=ElevenLabs for more human-like speech (same Relay fee).
 * Set VOICE_RELAY_BUDGET_MODE=true to skip ConversationRelay entirely (one-shot <Say> only —
 * no two-way AI, avoids the $0.07/min Relay charge).
 */
export type ConversationRelayTtsProvider = "Amazon" | "Google" | "ElevenLabs";

export function isVoiceRelayBudgetMode(): boolean {
  const v = process.env.VOICE_RELAY_BUDGET_MODE?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export function getConversationRelayTts() {
  const provider = (
    process.env.VOICE_RELAY_TTS_PROVIDER?.trim() || "Amazon"
  ) as ConversationRelayTtsProvider;

  const voice =
    process.env.VOICE_RELAY_TTS_VOICE?.trim() ||
    (provider === "ElevenLabs"
      ? "UgBBYS2sOqTuMpoF3BR0-flash_v2_5-0.95_0.65_0.8"
      : provider === "Google"
        ? "en-US-Journey-O"
        : "Joanna-Neural");

  const elevenlabsTextNormalization =
    process.env.VOICE_RELAY_ELEVENLABS_TEXT_NORM?.trim() || "on";

  return { provider, voice, elevenlabsTextNormalization };
}
