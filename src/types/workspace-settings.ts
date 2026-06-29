export type WorkspaceSettings = {
  workspaceId: string;
  /** AI triages inbox threads and generates HR documents. */
  inboxAutomationEnabled: boolean;
  /** Regenerate summary & sentiment after each inbound message. */
  aiAutoSummarize: boolean;
  /** Minimum score (0–100) before auto-creating a CRM lead from inbound sales intent. */
  crmQualificationThreshold: number;
  updatedAt: string;
};

export type WorkspaceSettingsPatch = Partial<
  Pick<
    WorkspaceSettings,
    | "inboxAutomationEnabled"
    | "aiAutoSummarize"
    | "crmQualificationThreshold"
  >
>;
