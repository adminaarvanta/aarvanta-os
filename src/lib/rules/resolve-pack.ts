import { getFinanceUkRulePack } from "@/lib/rules/packs/finance-uk-v1";
import { getHrRulePack } from "@/lib/rules/packs/hr-uk-v1";
import { PAYROLL_UK_RULE_PACK } from "@/lib/rules/packs/payroll-uk-v1";
import { LEGAL_UK_RULE_PACK } from "@/lib/rules/packs/legal-uk-v1";
import { listRulePacks, resolveRulePack } from "@/lib/rules/packs/uk-default";
import type { RulePack } from "@/lib/rules/types";
import type { BusinessIntent } from "@/lib/actions/intents";

export function listAllRulePacks(): RulePack[] {
  return [
    ...listRulePacks(),
    getFinanceUkRulePack(),
    getHrRulePack(),
    PAYROLL_UK_RULE_PACK,
    LEGAL_UK_RULE_PACK,
  ];
}

export function resolveRulePackForIntent(
  intent: BusinessIntent | string,
  options?: { country?: string; industry?: string }
): RulePack {
  const financeIntents = [
    "create_invoice",
    "post_journal_entry",
    "generate_pl",
    "reconcile_account",
  ];
  const payrollIntents = ["run_payroll", "generate_payslip"];
  const legalIntents = ["analyze_contract", "generate_contract"];
  const hrIntents = ["generate_hr_document", "hire_employee"];

  if (financeIntents.includes(intent)) return getFinanceUkRulePack();
  if (payrollIntents.includes(intent)) return PAYROLL_UK_RULE_PACK;
  if (legalIntents.includes(intent)) return LEGAL_UK_RULE_PACK;
  if (hrIntents.includes(intent)) return getHrRulePack();

  return resolveRulePack(options ?? {});
}
