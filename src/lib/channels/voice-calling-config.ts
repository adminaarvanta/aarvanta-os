import { isDemoClonedVoiceId } from "@/lib/channels/cloned-voice";
import {
  CUSTOM_VOICE_OPTION_ID,
  defaultVoiceIdFor,
  languageMatches,
  VOICE_CATALOG,
  VOICE_LANGUAGES,
} from "@/lib/channels/voice-catalog";
import {
  getConversationRelayTtsFromEnv,
  isVoiceRelayBudgetMode,
  type ConversationRelayTtsProvider,
} from "@/lib/channels/voice-relay-tts";
import type { WorkspaceSettings } from "@/types/workspace-settings";

export type ResolvedVoiceCallingConfig = {
  provider: ConversationRelayTtsProvider;
  voice: string;
  language: string;
  elevenlabsTextNormalization: string;
  callRecordingEnabled: boolean;
  callRecordingAnnounce: boolean;
  /** Spoken when recording + announce are on. */
  recordingNotice: string;
};

const RECORDING_NOTICE =
  "This call may be recorded for quality and training purposes.";

/**
 * Locale safe to put on ConversationRelay TwiML.
 * `multi` is only valid with ElevenLabs + Deepgram; Amazon/Google reject it
 * and end the session. Unknown codes fall back to en-US so the call still connects.
 */
export function conversationRelayLanguage(
  language: string | undefined,
  provider: ConversationRelayTtsProvider
): string {
  const code = language?.trim() || "en-US";
  if (code === "multi") {
    return provider === "ElevenLabs" ? "multi" : "en-US";
  }
  if (!VOICE_LANGUAGES.some((item) => item.id === code)) return "en-US";
  if (provider !== "ElevenLabs") {
    const supported = VOICE_CATALOG.some(
      (voice) =>
        voice.provider === provider && languageMatches(voice.languages, code)
    );
    if (!supported) return "en-US";
  }
  return code;
}

export function resolveVoiceCallingConfig(
  settings?: Pick<
    WorkspaceSettings,
    | "voiceTtsProvider"
    | "voiceId"
    | "voiceLanguage"
    | "voiceCustomId"
    | "callRecordingEnabled"
    | "callRecordingAnnounce"
  > | null
): ResolvedVoiceCallingConfig {
  const envTts = getConversationRelayTtsFromEnv();
  let provider = settings?.voiceTtsProvider ?? envTts.provider;

  // Budget / one-shot <Say> only supports Amazon Polly.
  if (isVoiceRelayBudgetMode() && provider !== "Amazon") {
    provider = "Amazon";
  }

  const requestedLanguage =
    settings?.voiceLanguage &&
    VOICE_LANGUAGES.some((l) => l.id === settings.voiceLanguage)
      ? settings.voiceLanguage
      : "en-US";
  const language = conversationRelayLanguage(requestedLanguage, provider);

  const customRaw = settings?.voiceCustomId?.trim();
  const custom =
    customRaw && !isDemoClonedVoiceId(customRaw) ? customRaw : "";
  const curated = settings?.voiceId?.trim();
  const voice =
    custom ||
    (curated && curated !== CUSTOM_VOICE_OPTION_ID
      ? curated
      : defaultVoiceIdFor(provider, language)) ||
    envTts.voice;

  const announce = settings?.callRecordingAnnounce !== false;

  return {
    provider,
    voice,
    language,
    elevenlabsTextNormalization: envTts.elevenlabsTextNormalization,
    callRecordingEnabled: Boolean(settings?.callRecordingEnabled),
    callRecordingAnnounce: announce,
    recordingNotice: RECORDING_NOTICE,
  };
}
