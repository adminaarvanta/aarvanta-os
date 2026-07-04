export type WorkspaceSettings = {
  workspaceId: string;
  /** AI triages inbox threads and generates HR documents. */
  inboxAutomationEnabled: boolean;
  /** Regenerate summary & sentiment after each inbound message. */
  aiAutoSummarize: boolean;
  /** Minimum score (0–100) before auto-creating a CRM lead from inbound sales intent. */
  crmQualificationThreshold: number;
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
  updatedAt: string;
};

export type WorkspaceSettingsPatch = Partial<
  Pick<
    WorkspaceSettings,
    | "inboxAutomationEnabled"
    | "aiAutoSummarize"
    | "crmQualificationThreshold"
    | "industryProfileId"
    | "countryCode"
    | "businessName"
    | "storeSlug"
    | "logoUrl"
    | "primaryDomain"
  >
>;
