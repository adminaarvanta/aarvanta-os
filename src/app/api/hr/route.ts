import { NextResponse } from "next/server";
import { getHrStore } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    const scope = await getTenantScope();
    const store = getHrStore();
    const [candidates, employees, courses, documents] = await Promise.all([
      store.list(scope),
      store.listEmployees(scope),
      store.listCourses(scope),
      store.listDocuments(scope),
    ]);
    return NextResponse.json({ candidates, employees, courses, documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("HR_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
