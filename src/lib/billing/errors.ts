import type { PublicPlanId } from "@/types/platform-modules";

export type PlanErrorCode = "FEATURE_LOCKED" | "PLAN_LIMIT" | "EXPLORE_ONLY";

export class PlanEntitlementError extends Error {
  readonly code: PlanErrorCode;
  readonly upgradeHint?: PublicPlanId;
  readonly feature?: string;
  readonly metric?: string;

  constructor(
    code: PlanErrorCode,
    message: string,
    opts?: { upgradeHint?: PublicPlanId; feature?: string; metric?: string }
  ) {
    super(message);
    this.name = "PlanEntitlementError";
    this.code = code;
    this.upgradeHint = opts?.upgradeHint;
    this.feature = opts?.feature;
    this.metric = opts?.metric;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      upgradeHint: this.upgradeHint,
      feature: this.feature,
      metric: this.metric,
    };
  }
}

export function isPlanEntitlementError(error: unknown): error is PlanEntitlementError {
  return error instanceof PlanEntitlementError;
}

/** HTTP status for entitlement failures. */
export function planErrorStatus(error: PlanEntitlementError): number {
  if (error.code === "FEATURE_LOCKED" || error.code === "EXPLORE_ONLY") return 403;
  return 402;
}
