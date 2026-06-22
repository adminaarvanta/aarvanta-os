import { NextResponse } from "next/server";
import { getCustomerSuccessStore } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    const scope = await getTenantScope();
    const health = await getCustomerSuccessStore().list(scope);
    return NextResponse.json({ health });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("SUCCESS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
