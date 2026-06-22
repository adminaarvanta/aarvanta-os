import { NextResponse } from "next/server";
import { getWikiStore } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    const scope = await getTenantScope();
    const pages = await getWikiStore().list(scope);
    return NextResponse.json({ pages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("WIKI_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
