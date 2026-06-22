import { NextResponse } from "next/server";
import { getFranchiseStore } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    const scope = await getTenantScope();
    const locations = await getFranchiseStore().list(scope);
    return NextResponse.json({ locations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("FRANCHISE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
