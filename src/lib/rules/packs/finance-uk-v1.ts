import type { RulePack } from "@/lib/rules/types";
import { UK_VAT_REGISTRATION_THRESHOLD, UK_VAT_STANDARD_RATE } from "@/lib/finance/chart-of-accounts-uk";

/** UK finance & VAT rules — data-driven (AGEB Vol 3). */
export const FINANCE_UK_RULE_PACK: RulePack = {
  id: "finance-uk-v1",
  label: "United Kingdom — Finance & VAT",
  country: "GB",
  industry: "finance",
  version: "1.0.0",
  rules: [
    {
      id: "invoice-requires-amount",
      name: "Invoice must have positive amount",
      when: [{ field: "invoice.amount", operator: "lte", value: 0 }],
      then: {
        type: "reject",
        params: { message: "Invoice amount must be greater than zero." },
      },
    },
    {
      id: "invoice-high-value-approval",
      name: "High-value invoice requires approval",
      when: [{ field: "invoice.amount", operator: "gte", value: 10000 }],
      then: {
        type: "require_approval",
        params: { role: "manager", reason: "Invoice exceeds £10,000" },
      },
    },
    {
      id: "vat-registration-threshold",
      name: "VAT registration advisory",
      when: [{ field: "business.annualTurnover", operator: "gte", value: UK_VAT_REGISTRATION_THRESHOLD }],
      then: {
        type: "require_approval",
        params: {
          role: "cfo",
          reason: `Annual turnover may exceed VAT threshold (£${UK_VAT_REGISTRATION_THRESHOLD.toLocaleString()})`,
        },
      },
    },
  ],
};

export function calculateUkVat(netAmount: number, rate = UK_VAT_STANDARD_RATE): {
  net: number;
  vat: number;
  gross: number;
} {
  const vat = Math.round(netAmount * rate * 100) / 100;
  return { net: netAmount, vat, gross: netAmount + vat };
}

export function getFinanceUkRulePack(): RulePack {
  return FINANCE_UK_RULE_PACK;
}
