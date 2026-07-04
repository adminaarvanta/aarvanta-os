import type { RulePack } from "@/lib/rules/types";

export const LEGAL_UK_RULE_PACK: RulePack = {
  id: "legal-uk-v1",
  label: "United Kingdom — Legal & Contracts",
  country: "GB",
  industry: "legal",
  version: "1.0.0",
  rules: [
    {
      id: "contract-high-risk-block",
      name: "Block activation of high-risk contracts",
      when: [
        { field: "contract.riskScore", operator: "gte", value: 70 },
        { field: "contract.action", operator: "eq", value: "activate" },
      ],
      then: {
        type: "reject",
        params: { message: "Contract risk score too high for auto-activation." },
      },
    },
    {
      id: "contract-review-required",
      name: "Medium-risk contracts require review",
      when: [{ field: "contract.riskScore", operator: "gte", value: 40 }],
      then: {
        type: "require_approval",
        params: { role: "manager", reason: "Contract requires legal review" },
      },
    },
  ],
};
