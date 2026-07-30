import { NextResponse } from "next/server";
import {
  isPlanEntitlementError,
  planErrorStatus,
} from "@/lib/billing/errors";
import { planEntitlementResponse } from "@/lib/api/request";

/** Catch plan entitlement errors and return 402/403 JSON. */
export function handlePlanError(error: unknown): NextResponse | null {
  if (!isPlanEntitlementError(error)) return null;
  return planEntitlementResponse({
    code: error.code,
    message: error.message,
    upgradeHint: error.upgradeHint,
    feature: error.feature,
    metric: error.metric,
    status: planErrorStatus(error),
  });
}
