import type { ConversationRelayTtsProvider } from "@/lib/channels/voice-relay-tts";
import {
  CUSTOM_VOICE_OPTION_ID,
  defaultVoiceIdFor,
  VOICE_LANGUAGES,
} from "@/lib/channels/voice-catalog";
import {
  getConversationRelayTtsFromEnv,
  isVoiceRelayBudgetMode,
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

  const language =
    settings?.voiceLanguage &&
    VOICE_LANGUAGES.some((l) => l.id === settings.voiceLanguage)
      ? settings.voiceLanguage
      : "en-US";

  const custom = settings?.voiceCustomId?.trim();
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
