import { NextResponse } from "next/server";
import { getSsoStore } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    const scope = await getTenantScope();
    const connections = await getSsoStore().list(scope);
    return NextResponse.json({ connections });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("SSO_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
