/**
 * ConversationRelay TTS — ElevenLabs via Twilio (human-like voiceover).
 * Billed through Twilio; no separate ElevenLabs API key required.
 *
 * Market fit: ElevenLabs is the quality leader for natural speech;
 * ConversationRelay's Flash 2.5 telephony voice is mid-tier cost vs Amazon Polly
 * (cheaper) and custom ElevenLabs/OpenAI streaming pipelines (more ops + usually more $$).
 */
export function getConversationRelayTts() {
  const provider = (
    process.env.VOICE_RELAY_TTS_PROVIDER?.trim() || "ElevenLabs"
  ) as "ElevenLabs" | "Amazon" | "Google";

  // Default: Twilio en-US telephony ElevenLabs voice (Mark) + Flash 2.5
  // Format: {voiceId}-{model}-{speed}_{stability}_{similarity}
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
