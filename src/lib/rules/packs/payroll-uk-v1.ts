import type { RulePack } from "@/lib/rules/types";

export const PAYROLL_UK_RULE_PACK: RulePack = {
  id: "payroll-uk-v1",
  label: "United Kingdom — Payroll",
  country: "GB",
  industry: "payroll",
  version: "1.0.0",
  rules: [
    {
      id: "payroll-requires-employees",
      name: "Payroll requires at least one employee",
      when: [{ field: "payroll.employeeCount", operator: "lte", value: 0 }],
      then: {
        type: "reject",
        params: { message: "Cannot run payroll with zero employees." },
      },
    },
    {
      id: "payroll-high-gross-approval",
      name: "High payroll run requires approval",
      when: [{ field: "payroll.grossTotal", operator: "gte", value: 50000 }],
      then: {
        type: "require_approval",
        params: { role: "admin", reason: "Monthly payroll exceeds £50,000" },
      },
    },
  ],
};
