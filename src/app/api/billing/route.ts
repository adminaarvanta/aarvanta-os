import { NextResponse } from "next/server";
import { getBillingStore } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    const scope = await getTenantScope();
    const store = getBillingStore();
    const [plans, subscriptions, usage] = await Promise.all([
      store.listPlans(),
      store.list(scope),
      store.listUsage(scope),
    ]);
    const subscription = subscriptions[0] ?? null;
    return NextResponse.json({ plans, subscription, usage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("BILLING_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
