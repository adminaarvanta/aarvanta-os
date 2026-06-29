export type RuleOperator = "eq" | "neq" | "gte" | "lte" | "in" | "exists" | "not_exists";

export type RuleCondition = {
  field: string;
  operator: RuleOperator;
  value?: unknown;
};

export type RuleAction = {
  type: string;
  params?: Record<string, unknown>;
};

export type BusinessRule = {
  id: string;
  name: string;
  description?: string;
  when: RuleCondition[];
  then: RuleAction;
  else?: RuleAction;
};

export type RulePack = {
  id: string;
  label: string;
  country: string;
  industry?: string;
  version: string;
  rules: BusinessRule[];
};

export type RuleEvaluationContext = Record<string, unknown>;

export type RuleEvaluationResult = {
  ruleId: string;
  matched: boolean;
  action?: RuleAction;
  reasoning: string;
};
