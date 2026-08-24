import type { ConversationRelayTtsProvider } from "@/lib/channels/voice-relay-tts";

export type WorkspaceSettings = {
  workspaceId: string;
  /** AI triages inbox threads and generates HR documents. */
  inboxAutomationEnabled: boolean;
  /** HR approver for escalations and high-risk document sends. */
  hrApproverEmail: string;
  /** Regenerate summary & sentiment after each inbound message. */
  aiAutoSummarize: boolean;
  /** Minimum score (0–100) before auto-creating a CRM lead from inbound sales intent. */
  crmQualificationThreshold: number;
  /** Default currency for finance, payroll, and proposals. */
  defaultCurrency: string;
  /** Set by Launch OS — AGEB industry profile id. */
  industryProfileId?: string;
  /** Primary country code (ISO-style) from Launch OS. */
  countryCode?: string;
  /** Business display name from Launch OS. */
  businessName?: string;
  /** Public store slug from Launch OS deploy. */
  storeSlug?: string;
  logoUrl?: string;
  primaryDomain?: string;
  /** Voice OS — ConversationRelay TTS provider. */
  voiceTtsProvider?: ConversationRelayTtsProvider;
  /** Voice OS — Twilio voice id (or custom paste). */
  voiceId?: string;
  /** Voice OS — BCP-47 language for STT/TTS (e.g. en-US). */
  voiceLanguage?: string;
  /** When set, overrides curated voiceId (custom ElevenLabs/Twilio voice). */
  voiceCustomId?: string;
  /** Opt-in Twilio call recording (default off). */
  callRecordingEnabled?: boolean;
  /** Speak a short recording notice when recording is on (default true). */
  callRecordingAnnounce?: boolean;
  /** Voice Agent used for inbound, Dialer, and scheduled calls when none is specified. */
  voicePrimaryAgentId?: string;
  /** IANA timezone for default callback slots. */
  voiceCallbackTimezone?: string;
  /** Hour (0–23) for the “next morning” slot. */
  voiceMorningHour?: number;
  /** Hour (0–23) for the “next afternoon” slot. */
  voiceAfternoonHour?: number;
  /** Which default callback slots are enabled. */
  voiceScheduleSlotIds?: Array<
    "next_morning" | "next_afternoon" | "in_2_hours" | "tomorrow_same"
  >;
  updatedAt: string;
};

export type WorkspaceSettingsPatch = Partial<
  Pick<
    WorkspaceSettings,
    | "inboxAutomationEnabled"
    | "hrApproverEmail"
    | "aiAutoSummarize"
    | "crmQualificationThreshold"
    | "defaultCurrency"
    | "industryProfileId"
    | "countryCode"
    | "businessName"
    | "storeSlug"
    | "logoUrl"
    | "primaryDomain"
    | "voiceTtsProvider"
    | "voiceId"
    | "voiceLanguage"
    | "voiceCustomId"
    | "callRecordingEnabled"
    | "callRecordingAnnounce"
    | "voicePrimaryAgentId"
    | "voiceCallbackTimezone"
    | "voiceMorningHour"
    | "voiceAfternoonHour"
    | "voiceScheduleSlotIds"
  >
>;
