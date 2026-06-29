import type {
  BusinessRule,
  RuleCondition,
  RuleEvaluationContext,
  RuleEvaluationResult,
  RulePack,
} from "@/lib/rules/types";

function getFieldValue(context: RuleEvaluationContext, field: string): unknown {
  const parts = field.split(".");
  let current: unknown = context;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function matchesCondition(
  condition: RuleCondition,
  context: RuleEvaluationContext
): boolean {
  const value = getFieldValue(context, condition.field);

  switch (condition.operator) {
    case "exists":
      return value !== undefined && value !== null && value !== "";
    case "not_exists":
      return value === undefined || value === null || value === "";
    case "eq":
      return value === condition.value;
    case "neq":
      return value !== condition.value;
    case "gte":
      return Number(value) >= Number(condition.value);
    case "lte":
      return Number(value) <= Number(condition.value);
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(value);
    default:
      return false;
  }
}

export function evaluateRule(
  rule: BusinessRule,
  context: RuleEvaluationContext
): RuleEvaluationResult {
  const matched = rule.when.every((condition) =>
    matchesCondition(condition, context)
  );

  if (matched) {
    return {
      ruleId: rule.id,
      matched: true,
      action: rule.then,
      reasoning: `Rule "${rule.name}" matched all conditions.`,
    };
  }

  if (rule.else) {
    return {
      ruleId: rule.id,
      matched: false,
      action: rule.else,
      reasoning: `Rule "${rule.name}" did not match; applied fallback.`,
    };
  }

  return {
    ruleId: rule.id,
    matched: false,
    reasoning: `Rule "${rule.name}" did not match.`,
  };
}

export function evaluateRulePack(
  pack: RulePack,
  context: RuleEvaluationContext
): RuleEvaluationResult[] {
  return pack.rules.map((rule) => evaluateRule(rule, context));
}

export function findFirstMatchingRule(
  pack: RulePack,
  context: RuleEvaluationContext
): RuleEvaluationResult | null {
  for (const rule of pack.rules) {
    const result = evaluateRule(rule, context);
    if (result.matched && result.action) return result;
  }
  return null;
}
