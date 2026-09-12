/**
 * Twilio ConversationRelay ElevenLabs voice IDs.
 *
 * Bare IDs (e.g. Sarah `EXAVITQu4vr4xnSDxMaL`) use Flash 2.5 with default
 * stability — fast, but flat on a phone. Twilio lets us pin model + tuning:
 *   `{voiceId}-{model}-{speed}_{stability}_{similarity}`
 *
 * turbo_v2_5 is the highest-quality model ConversationRelay supports.
 * Lower stability = more emotion; we stay in the conversational range.
 *
 * @see https://www.twilio.com/docs/voice/conversationrelay/voice-configuration
 */

export const ELEVENLABS_PHONE_MODEL = "turbo_v2_5";
/** Slightly under 1.0 so the line doesn't rush. Range 0.7–1.2. */
export const ELEVENLABS_PHONE_SPEED = "0.95";
/** Lower = more expressive. 0.35–0.45 sounds human; 0.8+ is monotone. */
export const ELEVENLABS_PHONE_STABILITY = "0.38";
export const ELEVENLABS_PHONE_SIMILARITY = "0.82";

const TUNED_RE =
  /^([A-Za-z0-9]+)(?:-(flash_v2_5|flash_v2|turbo_v2_5|turbo_v2))?(?:-(\d+(?:\.\d+)?)_(\d+(?:\.\d+)?)_(\d+(?:\.\d+)?))?$/;

export function elevenLabsVoiceBaseId(voiceId: string): string {
  const trimmed = voiceId.trim();
  const match = TUNED_RE.exec(trimmed);
  return match?.[1] ?? trimmed.split("-")[0] ?? trimmed;
}

export function isElevenLabsVoiceAlreadyTuned(voiceId: string): boolean {
  const match = TUNED_RE.exec(voiceId.trim());
  return Boolean(match?.[2] || match?.[3]);
}

/** ConversationRelay `voice=` value — Turbo 2.5 + human phone tuning. */
export function applyElevenLabsPhoneQuality(voiceId: string): string {
  const trimmed = voiceId.trim();
  if (!trimmed) return trimmed;
  if (isElevenLabsVoiceAlreadyTuned(trimmed)) return trimmed;
  return [
    elevenLabsVoiceBaseId(trimmed),
    ELEVENLABS_PHONE_MODEL,
    `${ELEVENLABS_PHONE_SPEED}_${ELEVENLABS_PHONE_STABILITY}_${ELEVENLABS_PHONE_SIMILARITY}`,
  ].join("-");
}

export const ELEVENLABS_API_VOICE_SETTINGS = {
  stability: 0.38,
  similarity_boost: 0.82,
  style: 0.35,
  use_speaker_boost: true,
  speed: 0.95,
} as const;

/** Highest-quality ElevenLabs model we can call with our own API key. */
export const ELEVENLABS_PREMIUM_MODEL_ID = "eleven_multilingual_v2";
