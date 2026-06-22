import type { AgentType } from "@/types/workforce";

/** Canonical agent type list — use for Zod enums and iteration. */
export const AGENT_TYPES = [
  "ceo",
  "coo",
  "sales_manager",
  "marketing_manager",
  "hr_manager",
  "cfo",
  "customer_success_manager",
] as const satisfies readonly AgentType[];

export const AGENT_TYPE_ZOD = [
  "ceo",
  "coo",
  "sales_manager",
  "marketing_manager",
  "hr_manager",
  "cfo",
  "customer_success_manager",
] as const;
