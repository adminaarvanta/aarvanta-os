import { findFirstMatchingRule } from "@/lib/rules/evaluate";
import {
  buildHrRuleContext,
  getHrRulePack,
} from "@/lib/rules/packs/hr-uk-v1";
import type { HrDocumentType } from "@/types/platform-modules";

export type HrRuleValidationResult =
  | { allowed: true; approvalRequired: false }
  | { allowed: false; message: string; ruleId: string }
  | { allowed: true; approvalRequired: true; reason?: string; role?: string };

export function validateHrDocumentRules(input: {
  documentType: HrDocumentType;
  contextFields: Record<string, string>;
  autoSend?: boolean;
}): HrRuleValidationResult {
  const pack = getHrRulePack();
  const context = buildHrRuleContext(input);
  const match = findFirstMatchingRule(pack, context);

  if (match?.matched && match.action?.type === "reject") {
    const message =
      typeof match.action.params?.message === "string"
        ? match.action.params.message
        : "HR document blocked by compliance rules.";
    return { allowed: false, message, ruleId: match.ruleId };
  }

  if (match?.matched && match.action?.type === "require_approval") {
    return {
      allowed: true,
      approvalRequired: true,
      reason:
        typeof match.action.params?.reason === "string"
          ? match.action.params.reason
          : undefined,
      role:
        typeof match.action.params?.role === "string"
          ? match.action.params.role
          : undefined,
    };
  }

  return { allowed: true, approvalRequired: false };
}
