import type { ConversationRelayTtsProvider } from "@/lib/channels/voice-relay-tts";

export type VoiceLanguageOption = {
  id: string;
  label: string;
};

export type VoiceCatalogEntry = {
  id: string;
  label: string;
  provider: ConversationRelayTtsProvider;
  /** Languages this voice is intended for (empty = any / multilingual). */
  languages: string[];
};

/**
 * ConversationRelay STT/TTS locales (BCP-47) plus auto-detect.
 * Defaults match Twilio's ConversationRelay voice table where documented.
 */
export const VOICE_LANGUAGES: VoiceLanguageOption[] = [
  { id: "multi", label: "Auto-detect (multilingual)" },
  { id: "en-US", label: "English (US)" },
  { id: "en-GB", label: "English (UK)" },
  { id: "en-AU", label: "English (Australia)" },
  { id: "en-IN", label: "English (India)" },
  { id: "hi-IN", label: "Hindi (India)" },
  { id: "bn-IN", label: "Bengali (India)" },
  { id: "ta-IN", label: "Tamil (India)" },
  { id: "te-IN", label: "Telugu (India)" },
  { id: "kn-IN", label: "Kannada (India)" },
  { id: "ml-IN", label: "Malayalam (India)" },
  { id: "mr-IN", label: "Marathi (India)" },
  { id: "gu-IN", label: "Gujarati (India)" },
  { id: "pa-IN", label: "Punjabi (India)" },
  { id: "ur-IN", label: "Urdu (India)" },
  { id: "ar-XA", label: "Arabic" },
  { id: "bg-BG", label: "Bulgarian" },
  { id: "ca-ES", label: "Catalan" },
  { id: "zh-CN", label: "Chinese (Mandarin, Simplified)" },
  { id: "yue-HK", label: "Chinese (Cantonese, Hong Kong)" },
  { id: "hr-HR", label: "Croatian" },
  { id: "cs-CZ", label: "Czech" },
  { id: "da-DK", label: "Danish" },
  { id: "nl-NL", label: "Dutch" },
  { id: "nl-BE", label: "Dutch (Belgium)" },
  { id: "fil-PH", label: "Filipino" },
  { id: "fi-FI", label: "Finnish" },
  { id: "fr-FR", label: "French (France)" },
  { id: "fr-CA", label: "French (Canada)" },
  { id: "de-DE", label: "German" },
  { id: "el-GR", label: "Greek" },
  { id: "he-IL", label: "Hebrew" },
  { id: "hu-HU", label: "Hungarian" },
  { id: "id-ID", label: "Indonesian" },
  { id: "it-IT", label: "Italian" },
  { id: "ja-JP", label: "Japanese" },
  { id: "ko-KR", label: "Korean" },
  { id: "ms-MY", label: "Malay" },
  { id: "nb-NO", label: "Norwegian" },
  { id: "pl-PL", label: "Polish" },
  { id: "pt-BR", label: "Portuguese (Brazil)" },
  { id: "pt-PT", label: "Portuguese (Portugal)" },
  { id: "ro-RO", label: "Romanian" },
  { id: "ru-RU", label: "Russian" },
  { id: "sk-SK", label: "Slovak" },
  { id: "es-ES", label: "Spanish (Spain)" },
  { id: "es-US", label: "Spanish (US)" },
  { id: "es-MX", label: "Spanish (Mexico)" },
  { id: "sv-SE", label: "Swedish" },
  { id: "th-TH", label: "Thai" },
  { id: "tr-TR", label: "Turkish" },
  { id: "uk-UA", label: "Ukrainian" },
  { id: "vi-VN", label: "Vietnamese" },
];

/** Curated Twilio ConversationRelay voices. Empty `languages` = multilingual. */
export const VOICE_CATALOG: VoiceCatalogEntry[] = [
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    label: "ElevenLabs — Sarah (multilingual)",
    provider: "ElevenLabs",
    languages: [],
  },
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    label: "ElevenLabs — Rachel (multilingual)",
    provider: "ElevenLabs",
    languages: [],
  },
  {
    // flash_v2_5 is lower latency but flatter / more robotic than Sarah/Rachel
    id: "UgBBYS2sOqTuMpoF3BR0-flash_v2_5-0.95_0.65_0.8",
    label: "ElevenLabs — Mark (fast, multilingual)",
    provider: "ElevenLabs",
    languages: [],
  },
  {
    id: "UgBBYS2sOqTuMpoF3BR0",
    label: "ElevenLabs — Mark (en-US default)",
    provider: "ElevenLabs",
    languages: ["en-US", "multi"],
  },
  {
    id: "Fahco4VZzobUeiPqni1S",
    label: "ElevenLabs — English (UK)",
    provider: "ElevenLabs",
    languages: ["en-GB"],
  },
  {
    id: "9Ft9sm9dzvprPILZmLJl",
    label: "ElevenLabs — English (Australia)",
    provider: "ElevenLabs",
    languages: ["en-AU"],
  },
  {
    id: "mCQMfsqGDT6IDkEKR20a",
    label: "ElevenLabs — English (India)",
    provider: "ElevenLabs",
    languages: ["en-IN"],
  },
  {
    id: "IvLWq57RKibBrqZGpQrC",
    label: "ElevenLabs — Hindi",
    provider: "ElevenLabs",
    languages: ["hi-IN"],
  },
  {
    id: "ZhJ5LanYnCmLKQUXvsV7",
    label: "ElevenLabs — Tamil",
    provider: "ElevenLabs",
    languages: ["ta-IN"],
  },
  {
    id: "6xftrpatV0jGmFHxDjUv",
    label: "ElevenLabs — Spanish (Spain)",
    provider: "ElevenLabs",
    languages: ["es-ES"],
  },
  {
    id: "CaJslL1xziwefCeTNzHv",
    label: "ElevenLabs — Spanish (US)",
    provider: "ElevenLabs",
    languages: ["es-US", "es-MX"],
  },
  {
    id: "a5n9pJUnAhX4fn7lx3uo",
    label: "ElevenLabs — French",
    provider: "ElevenLabs",
    languages: ["fr-FR"],
  },
  {
    id: "IPgYtHTNLjC7Bq7IPHrm",
    label: "ElevenLabs — French (Canada)",
    provider: "ElevenLabs",
    languages: ["fr-CA"],
  },
  {
    id: "FTNCalFNG5bRnkkaP5Ug",
    label: "ElevenLabs — German",
    provider: "ElevenLabs",
    languages: ["de-DE"],
  },
  {
    id: "uScy1bXtKz8vPzfdFsFw",
    label: "ElevenLabs — Italian",
    provider: "ElevenLabs",
    languages: ["it-IT"],
  },
  {
    id: "CstacWqMhJQlnfLPxRG4",
    label: "ElevenLabs — Portuguese (Brazil)",
    provider: "ElevenLabs",
    languages: ["pt-BR"],
  },
  {
    id: "TsZfI8Nbn2Xd7ArC76n9",
    label: "ElevenLabs — Portuguese (Portugal)",
    provider: "ElevenLabs",
    languages: ["pt-PT"],
  },
  {
    id: "UNBIyLbtFB9k7FKW8wJv",
    label: "ElevenLabs — Dutch",
    provider: "ElevenLabs",
    languages: ["nl-NL"],
  },
  {
    id: "s7Z6uboUuE4Nd8Q2nye6",
    label: "ElevenLabs — Dutch (Belgium)",
    provider: "ElevenLabs",
    languages: ["nl-BE"],
  },
  {
    id: "3JDquces8E8bkmvbh6Bc",
    label: "ElevenLabs — Japanese",
    provider: "ElevenLabs",
    languages: ["ja-JP"],
  },
  {
    id: "uyVNoMrnUku1dZyVEXwD",
    label: "ElevenLabs — Korean",
    provider: "ElevenLabs",
    languages: ["ko-KR"],
  },
  {
    id: "1k39YpzqXZn52BgyLyGO",
    label: "ElevenLabs — Indonesian",
    provider: "ElevenLabs",
    languages: ["id-ID"],
  },
  {
    id: "foH7s9fX31wFFH2yqrFa",
    label: "ElevenLabs — Vietnamese",
    provider: "ElevenLabs",
    languages: ["vi-VN"],
  },
  {
    id: "IuRRIAcbQK5AQk1XevPj",
    label: "ElevenLabs — Turkish",
    provider: "ElevenLabs",
    languages: ["tr-TR"],
  },
  {
    id: "AB9XsbSA4eLG12t2myjN",
    label: "ElevenLabs — Bulgarian / Russian",
    provider: "ElevenLabs",
    languages: ["bg-BG", "ru-RU"],
  },
  {
    id: "uYFJyGaibp4N2VwYQshk",
    label: "ElevenLabs — Czech",
    provider: "ElevenLabs",
    languages: ["cs-CZ"],
  },
  {
    id: "ygiXC2Oa1BiHksD3WkJZ",
    label: "ElevenLabs — Danish",
    provider: "ElevenLabs",
    languages: ["da-DK"],
  },
  {
    id: "6xPz2opT0y5qtoRh1U1Y",
    label: "ElevenLabs — Finnish",
    provider: "ElevenLabs",
    languages: ["fi-FI"],
  },
  {
    id: "TumdjBNWanlT3ysvclWh",
    label: "ElevenLabs — Hungarian",
    provider: "ElevenLabs",
    languages: ["hu-HU"],
  },
  {
    id: "W0sqKm1Sfw1EzlCH14FQ",
    label: "ElevenLabs — Polish",
    provider: "ElevenLabs",
    languages: ["pl-PL"],
  },
  {
    id: "OlBp4oyr3FBAGEAtJOnU",
    label: "ElevenLabs — Romanian",
    provider: "ElevenLabs",
    languages: ["ro-RO"],
  },
  {
    id: "4xkUqaR9MYOJHoaC1Nak",
    label: "ElevenLabs — Swedish",
    provider: "ElevenLabs",
    languages: ["sv-SE"],
  },
  {
    id: "nCqaTnIbLdME87OuQaZY",
    label: "ElevenLabs — Ukrainian",
    provider: "ElevenLabs",
    languages: ["uk-UA"],
  },
  {
    id: "en-US-Journey-O",
    label: "Google — Journey O",
    provider: "Google",
    languages: ["en-US", "multi"],
  },
  {
    id: "en-GB-Neural2-A",
    label: "Google — Neural2 A (UK)",
    provider: "Google",
    languages: ["en-GB"],
  },
  {
    id: "hi-IN-Neural2-A",
    label: "Google — Neural2 A (Hindi)",
    provider: "Google",
    languages: ["hi-IN"],
  },
  {
    id: "bn-IN-Standard-A",
    label: "Google — Standard A (Bengali)",
    provider: "Google",
    languages: ["bn-IN"],
  },
  {
    id: "ta-IN-Standard-A",
    label: "Google — Standard A (Tamil)",
    provider: "Google",
    languages: ["ta-IN"],
  },
  {
    id: "te-IN-Standard-A",
    label: "Google — Standard A (Telugu)",
    provider: "Google",
    languages: ["te-IN"],
  },
  {
    id: "kn-IN-Standard-A",
    label: "Google — Standard A (Kannada)",
    provider: "Google",
    languages: ["kn-IN"],
  },
  {
    id: "ml-IN-Standard-A",
    label: "Google — Standard A (Malayalam)",
    provider: "Google",
    languages: ["ml-IN"],
  },
  {
    id: "mr-IN-Standard-A",
    label: "Google — Standard A (Marathi)",
    provider: "Google",
    languages: ["mr-IN"],
  },
  {
    id: "gu-IN-Standard-A",
    label: "Google — Standard A (Gujarati)",
    provider: "Google",
    languages: ["gu-IN"],
  },
  {
    id: "pa-IN-Standard-A",
    label: "Google — Standard A (Punjabi)",
    provider: "Google",
    languages: ["pa-IN"],
  },
  {
    id: "ar-XA-Wavenet-B",
    label: "Google — Wavenet B (Arabic)",
    provider: "Google",
    languages: ["ar-XA"],
  },
  {
    id: "cmn-CN-Wavenet-A",
    label: "Google — Wavenet A (Mandarin)",
    provider: "Google",
    languages: ["zh-CN"],
  },
  {
    id: "yue-HK-Standard-A",
    label: "Google — Standard A (Cantonese)",
    provider: "Google",
    languages: ["yue-HK"],
  },
  {
    id: "th-TH-Standard-A",
    label: "Google — Standard A (Thai)",
    provider: "Google",
    languages: ["th-TH"],
  },
  {
    id: "he-IL-Standard-A",
    label: "Google — Standard A (Hebrew)",
    provider: "Google",
    languages: ["he-IL"],
  },
  {
    id: "el-GR-Wavenet-A",
    label: "Google — Wavenet A (Greek)",
    provider: "Google",
    languages: ["el-GR"],
  },
  {
    id: "fil-PH-Wavenet-A",
    label: "Google — Wavenet A (Filipino)",
    provider: "Google",
    languages: ["fil-PH"],
  },
  {
    id: "ms-MY-Wavenet-A",
    label: "Google — Wavenet A (Malay)",
    provider: "Google",
    languages: ["ms-MY"],
  },
  {
    id: "nb-NO-Wavenet-A",
    label: "Google — Wavenet A (Norwegian)",
    provider: "Google",
    languages: ["nb-NO"],
  },
  {
    id: "sk-SK-Wavenet-A",
    label: "Google — Wavenet A (Slovak)",
    provider: "Google",
    languages: ["sk-SK"],
  },
  {
    id: "hr-HR-Standard-A",
    label: "Google — Standard A (Croatian)",
    provider: "Google",
    languages: ["hr-HR"],
  },
  {
    id: "ca-ES-Standard-A",
    label: "Google — Standard A (Catalan)",
    provider: "Google",
    languages: ["ca-ES"],
  },
  {
    id: "es-US-Neural2-A",
    label: "Google — Neural2 A (US Spanish)",
    provider: "Google",
    languages: ["es-US", "es-MX"],
  },
  {
    id: "Joanna-Neural",
    label: "Amazon Polly — Joanna",
    provider: "Amazon",
    languages: ["en-US", "multi"],
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
    id: "Mia-Neural",
    label: "Amazon Polly — Mia (Mexican Spanish)",
    provider: "Amazon",
    languages: ["es-MX"],
  },
  {
    id: "Lupe-Neural",
    label: "Amazon Polly — Lupe (US Spanish)",
    provider: "Amazon",
    languages: ["es-US"],
  },
  {
    id: "Lea-Neural",
    label: "Amazon Polly — Léa (French)",
    provider: "Amazon",
    languages: ["fr-FR"],
  },
  {
    id: "Gabrielle-Neural",
    label: "Amazon Polly — Gabrielle (Canadian French)",
    provider: "Amazon",
    languages: ["fr-CA"],
  },
  {
    id: "Vicki-Neural",
    label: "Amazon Polly — Vicki (German)",
    provider: "Amazon",
    languages: ["de-DE"],
  },
  {
    id: "Bianca-Neural",
    label: "Amazon Polly — Bianca (Italian)",
    provider: "Amazon",
    languages: ["it-IT"],
  },
  {
    id: "Camila-Neural",
    label: "Amazon Polly — Camila (Brazilian Portuguese)",
    provider: "Amazon",
    languages: ["pt-BR"],
  },
  {
    id: "Ines-Neural",
    label: "Amazon Polly — Inês (Portugal)",
    provider: "Amazon",
    languages: ["pt-PT"],
  },
  {
    id: "Takumi-Neural",
    label: "Amazon Polly — Takumi (Japanese)",
    provider: "Amazon",
    languages: ["ja-JP"],
  },
  {
    id: "Seoyeon-Neural",
    label: "Amazon Polly — Seoyeon (Korean)",
    provider: "Amazon",
    languages: ["ko-KR"],
  },
  {
    id: "Zhiyu-Neural",
    label: "Amazon Polly — Zhiyu (Mandarin)",
    provider: "Amazon",
    languages: ["zh-CN"],
  },
  {
    id: "Hala-Neural",
    label: "Amazon Polly — Hala (Arabic)",
    provider: "Amazon",
    languages: ["ar-XA"],
  },
  {
    id: "Olivia-Neural",
    label: "Amazon Polly — Olivia (Australia)",
    provider: "Amazon",
    languages: ["en-AU"],
  },
];

export const CUSTOM_VOICE_OPTION_ID = "__custom__";

function languageMatches(
  voiceLanguages: string[],
  language?: string
): boolean {
  if (!language || language === "multi") return true;
  if (voiceLanguages.length === 0) return true;
  return voiceLanguages.includes(language) || voiceLanguages.includes("multi");
}

export function voicesForProvider(
  provider: ConversationRelayTtsProvider,
  language?: string
): VoiceCatalogEntry[] {
  const matches = VOICE_CATALOG.filter((v) => {
    if (v.provider !== provider) return false;
    return languageMatches(v.languages, language);
  });

  if (!language || language === "multi") return matches;

  // Prefer locale-specific voices, then multilingual, so the default pick is right.
  return [...matches].sort((a, b) => {
    const aSpecific = a.languages.includes(language) ? 0 : 1;
    const bSpecific = b.languages.includes(language) ? 0 : 1;
    return aSpecific - bSpecific;
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
