import { NextResponse } from "next/server";
import { getTemplatesStore } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    const scope = await getTenantScope();
    const templates = await getTemplatesStore().list(scope);
    return NextResponse.json({ templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("TEMPLATES_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
