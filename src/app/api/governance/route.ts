import { NextResponse } from "next/server";
import { getGovernanceStore } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    const scope = await getTenantScope();
    const auditLogs = await getGovernanceStore().list(scope);
    return NextResponse.json({ auditLogs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("GOVERNANCE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
