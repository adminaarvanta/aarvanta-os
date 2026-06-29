import { findFirstMatchingRule } from "@/lib/rules/evaluate";
import { resolveRulePack } from "@/lib/rules/packs/uk-default";
import type { RuleEvaluationContext } from "@/lib/rules/types";

export type RuleValidationResult =
  | { allowed: true }
  | { allowed: false; message: string; ruleId: string };

/** Evaluate business rules before a mutation (Phase 1 rules engine). */
export function validateAgainstRules(
  context: RuleEvaluationContext,
  options?: { country?: string; industry?: string }
): RuleValidationResult {
  const pack = resolveRulePack(options ?? {});
  const match = findFirstMatchingRule(pack, context);

  if (match?.matched && match.action?.type === "reject") {
    const message =
      typeof match.action.params?.message === "string"
        ? match.action.params.message
        : "Action blocked by business rules.";
    return { allowed: false, message, ruleId: match.ruleId };
  }

  return { allowed: true };
}

export function approvalRequiredByRules(
  context: RuleEvaluationContext,
  options?: { country?: string; industry?: string }
): { required: boolean; reason?: string; role?: string } {
  const pack = resolveRulePack(options ?? {});
  const match = findFirstMatchingRule(pack, context);

  if (match?.matched && match.action?.type === "require_approval") {
    return {
      required: true,
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

  return { required: false };
}
