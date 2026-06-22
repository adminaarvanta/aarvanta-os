import { NextResponse } from "next/server";
import { listRegions, listTenantRegions } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    const scope = await getTenantScope();
    const [regions, tenantRegions] = await Promise.all([
      listRegions(),
      listTenantRegions(scope),
    ]);
    return NextResponse.json({ regions, tenantRegions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("REGIONS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
