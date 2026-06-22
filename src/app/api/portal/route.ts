import { NextResponse } from "next/server";
import { getPortalStore } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    const scope = await getTenantScope();
    const portalAccess = await getPortalStore().list(scope);
    return NextResponse.json({ portalAccess });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("PORTAL_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
