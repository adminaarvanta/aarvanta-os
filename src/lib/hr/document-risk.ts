import { getHrDocumentSpec } from "@/lib/hr/document-types";
import type { Sentiment } from "@/types/communication";
import type { HrDocumentType } from "@/types/platform-modules";
import type { HrCaseRiskTier } from "@/types/hr-case";

export const LOW_RISK_DOCUMENT_TYPES = new Set<HrDocumentType>([
  "experience_letter",
  "employment_verification",
  "salary_certificate",
]);

export const HIGH_RISK_DOCUMENT_TYPES = new Set<HrDocumentType>([
  "offer_letter",
  "warning_letter",
  "nda",
  "relieving_letter",
  "appointment_letter",
  "corporate_invoice",
  "policy_memo",
  "custom_corporate",
]);

const SALARY_APPROVAL_THRESHOLD = 75000;

export function getMissingRequiredFields(
  type: HrDocumentType,
  contextFields: Record<string, string>
): string[] {
  const spec = getHrDocumentSpec(type);
  return spec.fields
    .filter((field) => field.required && !contextFields[field.key]?.trim())
    .map((field) => field.key);
}

function parseSalaryAmount(value?: string): number | null {
  if (!value?.trim()) return null;
  const digits = value.replace(/[^0-9.]/g, "");
  const amount = Number.parseFloat(digits);
  return Number.isFinite(amount) ? amount : null;
}

export function classifyDocumentRisk(input: {
  documentType?: HrDocumentType;
  sentiment?: Sentiment;
  confidence: number;
  contextFields: Record<string, string>;
}): { tier: HrCaseRiskTier; reasons: string[] } {
  const reasons: string[] = [];
  let tier: HrCaseRiskTier = "low";

  if (!input.documentType) {
    return { tier: "high", reasons: ["No document type identified"] };
  }

  if (HIGH_RISK_DOCUMENT_TYPES.has(input.documentType)) {
    tier = "high";
    reasons.push(`${input.documentType} requires HR approval`);
  }

  if (
    input.sentiment === "urgent" ||
    input.sentiment === "frustrated"
  ) {
    tier = "high";
    reasons.push(`Sentiment is ${input.sentiment}`);
  }

  const missing = getMissingRequiredFields(input.documentType, input.contextFields);
  if (missing.length > 0) {
    tier = "high";
    reasons.push(`Missing required fields: ${missing.join(", ")}`);
  }

  const salary =
    parseSalaryAmount(input.contextFields.salary) ??
    parseSalaryAmount(input.contextFields.annualSalary);
  if (salary !== null && salary >= SALARY_APPROVAL_THRESHOLD) {
    tier = "high";
    reasons.push(`Salary £${salary.toLocaleString()} exceeds approval threshold`);
  }

  if (
    tier === "low" &&
    input.confidence < 0.75
  ) {
    tier = "high";
    reasons.push(`Confidence ${Math.round(input.confidence * 100)}% below auto-send threshold`);
  }

  if (tier === "low" && LOW_RISK_DOCUMENT_TYPES.has(input.documentType)) {
    reasons.push("Low-risk document eligible for auto-send");
  }

  return { tier, reasons };
}

export function canAutoSendSupportReply(sentiment?: Sentiment): boolean {
  return sentiment !== "urgent" && sentiment !== "frustrated";
}
