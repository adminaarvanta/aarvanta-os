import type { ConversationRelayTtsProvider } from "@/lib/channels/voice-relay-tts";

export type VoiceLanguageOption = {
  id: string;
  label: string;
};

export type VoiceCatalogEntry = {
  id: string;
  label: string;
  provider: ConversationRelayTtsProvider;
  /** Languages this voice is intended for (empty = any). */
  languages: string[];
};

export const VOICE_LANGUAGES: VoiceLanguageOption[] = [
  { id: "en-US", label: "English (US)" },
  { id: "en-GB", label: "English (UK)" },
  { id: "hi-IN", label: "Hindi (India)" },
  { id: "es-ES", label: "Spanish (Spain)" },
  { id: "fr-FR", label: "French (France)" },
  { id: "de-DE", label: "German" },
];

/** Curated Twilio ConversationRelay voices. */
export const VOICE_CATALOG: VoiceCatalogEntry[] = [
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    label: "ElevenLabs — Sarah (default)",
    provider: "ElevenLabs",
    languages: ["en-US", "en-GB"],
  },
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    label: "ElevenLabs — Rachel",
    provider: "ElevenLabs",
    languages: ["en-US", "en-GB"],
  },
  {
    // flash_v2_5 is lower latency but flatter / more robotic than Sarah/Rachel
    id: "UgBBYS2sOqTuMpoF3BR0-flash_v2_5-0.95_0.65_0.8",
    label: "ElevenLabs — Mark (fast)",
    provider: "ElevenLabs",
    languages: ["en-US", "en-GB"],
  },
  {
    id: "en-US-Journey-O",
    label: "Google — Journey O",
    provider: "Google",
    languages: ["en-US"],
  },
  {
    id: "en-GB-Neural2-A",
    label: "Google — Neural2 A (UK)",
    provider: "Google",
    languages: ["en-GB"],
  },
  {
    id: "Joanna-Neural",
    label: "Amazon Polly — Joanna",
    provider: "Amazon",
    languages: ["en-US"],
  },
  {
    id: "Amy-Neural",
    label: "Amazon Polly — Amy (UK)",
    provider: "Amazon",
    languages: ["en-GB"],
  },
  {
    id: "Kajal-Neural",
    label: "Amazon Polly — Kajal (Hindi)",
    provider: "Amazon",
    languages: ["hi-IN"],
  },
  {
    id: "Lucia-Neural",
    label: "Amazon Polly — Lucia (Spanish)",
    provider: "Amazon",
    languages: ["es-ES"],
  },
  {
    id: "Lea-Neural",
    label: "Amazon Polly — Léa (French)",
    provider: "Amazon",
    languages: ["fr-FR"],
  },
  {
    id: "Vicki-Neural",
    label: "Amazon Polly — Vicki (German)",
    provider: "Amazon",
    languages: ["de-DE"],
  },
];

export const CUSTOM_VOICE_OPTION_ID = "__custom__";

export function voicesForProvider(
  provider: ConversationRelayTtsProvider,
  language?: string
): VoiceCatalogEntry[] {
  return VOICE_CATALOG.filter((v) => {
    if (v.provider !== provider) return false;
    if (!language || v.languages.length === 0) return true;
    return v.languages.includes(language);
  });
}

export function defaultVoiceIdFor(
  provider: ConversationRelayTtsProvider,
  language?: string
): string {
  const match = voicesForProvider(provider, language)[0];
  if (match) return match.id;
  const any = VOICE_CATALOG.find((v) => v.provider === provider);
  return any?.id ?? VOICE_CATALOG[0]!.id;
}
