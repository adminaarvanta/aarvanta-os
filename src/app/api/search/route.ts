import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/request";
import { runGlobalSearch } from "@/lib/search/global-search";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET(req: Request) {
  try {
    const scope = await getTenantScope();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? "";
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") ?? 20), 1),
      40
    );

    const results = await runGlobalSearch(scope, query, limit);
    return NextResponse.json({ query, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return apiError(
      "SEARCH_ERROR",
      message,
      message === "Unauthorized" ? 401 : 500
    );
  }
}
