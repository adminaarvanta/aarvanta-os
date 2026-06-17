import { NextResponse } from "next/server";
import { buildAnalyticsSnapshot } from "@/lib/analytics/build-analytics";
import { getSessionContext } from "@/lib/tenant/context";
import { apiError } from "@/lib/api/request";
import type { ReportPeriod } from "@/types/analytics";

export async function GET(req: Request) {
  try {
    const ctx = await getSessionContext();
    const period = (new URL(req.url).searchParams.get("period") ??
      "monthly") as ReportPeriod;
    const snapshot = await buildAnalyticsSnapshot(ctx.scope, period);
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("ANALYTICS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
