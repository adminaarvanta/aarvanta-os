export type AiTeamModule =
  | "crm"
  | "hr"
  | "marketing"
  | "knowledge"
  | "finance"
  | "build"
  | "operations";

/** Client-safe prompt chips — keep this file free of server/data imports. */
export const ASK_AI_SUGGESTIONS: Record<AiTeamModule, string[]> = {
  crm: [
    "Summarize this customer",
    "Prepare follow-up",
    "Create a proposal",
  ],
  hr: ["Help hire an employee", "Review open roles and candidates"],
  marketing: ["Launch a marketing campaign", "Draft outreach copy"],
  knowledge: ["Review business priorities from knowledge"],
  finance: ["Prepare finance and performance reports"],
  build: ["Review the business and surface priorities"],
  operations: ["Review the business and surface priorities"],
};
