import type { RulePack } from "@/lib/rules/types";

export const HR_UK_RULE_PACK: RulePack = {
  id: "hr-uk-v1",
  label: "United Kingdom — HR Documents",
  country: "GB",
  industry: "hr",
  version: "1.0.0",
  rules: [
    {
      id: "hr-offer-requires-fields",
      name: "Offer letter requires job title and start date",
      when: [
        { field: "hrDocument.type", operator: "eq", value: "offer_letter" },
        { field: "hrDocument.jobTitle", operator: "not_exists" },
      ],
      then: {
        type: "reject",
        params: { message: "Offer letters require job title and start date." },
      },
    },
    {
      id: "hr-offer-high-salary",
      name: "High salary offer requires approval",
      when: [
        { field: "hrDocument.type", operator: "eq", value: "offer_letter" },
        { field: "hrDocument.salaryAmount", operator: "gte", value: 75000 },
      ],
      then: {
        type: "require_approval",
        params: {
          role: "admin",
          reason: "Offer salary exceeds £75,000 — HR approval required",
        },
      },
    },
    {
      id: "hr-warning-no-auto",
      name: "Warning letters always require approval",
      when: [{ field: "hrDocument.type", operator: "eq", value: "warning_letter" }],
      then: {
        type: "require_approval",
        params: {
          role: "admin",
          reason: "Disciplinary letters require HR approval before sending",
        },
      },
    },
    {
      id: "hr-nda-approval",
      name: "NDA requires approval",
      when: [{ field: "hrDocument.type", operator: "eq", value: "nda" }],
      then: {
        type: "require_approval",
        params: { role: "admin", reason: "NDAs require legal/HR review" },
      },
    },
  ],
};

export function getHrRulePack(): RulePack {
  return HR_UK_RULE_PACK;
}

function parseSalary(value?: string): number {
  if (!value?.trim()) return 0;
  const amount = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

export function buildHrRuleContext(input: {
  documentType: string;
  contextFields: Record<string, string>;
  autoSend?: boolean;
}): Record<string, unknown> {
  return {
    hrDocument: {
      type: input.documentType,
      jobTitle: input.contextFields.jobTitle,
      startDate: input.contextFields.startDate,
      salaryAmount: parseSalary(
        input.contextFields.salary ?? input.contextFields.annualSalary
      ),
      autoSend: input.autoSend ?? false,
      ...input.contextFields,
    },
  };
}
