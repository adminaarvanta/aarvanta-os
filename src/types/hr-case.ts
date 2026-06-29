import type { TenantScope } from "@/types/communication";
import type { HrDocumentType } from "@/types/platform-modules";

export type HrCaseStatus =
  | "triaging"
  | "pending_approval"
  | "generating"
  | "ready_to_send"
  | "sent"
  | "dismissed"
  | "failed";

export type HrCaseAction =
  | "none"
  | "support_reply"
  | "generate_document"
  | "escalate_human";

export type HrCaseRiskTier = "low" | "high";

export interface HrCase extends TenantScope {
  id: string;
  conversationId: string;
  contactId?: string;
  subjectName: string;
  subjectKind?: "employee" | "candidate" | "vendor" | "other";
  subjectId?: string;
  proposedAction: HrCaseAction;
  proposedDocumentType?: HrDocumentType;
  contextFields: Record<string, string>;
  supportReply?: string;
  riskTier: HrCaseRiskTier;
  riskReasons: string[];
  status: HrCaseStatus;
  documentId?: string;
  aiSummary: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export const OPEN_HR_CASE_STATUSES: HrCaseStatus[] = [
  "triaging",
  "pending_approval",
  "generating",
  "ready_to_send",
];
