import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { crmNow } from "@/lib/data/crm-helpers";
import { getHrStore } from "@/lib/data/platform-store";
import { getSessionContext, getTenantScope } from "@/lib/tenant/context";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getTenantScope();
    const { id } = await params;
    const hrCase = await getHrStore().getCase(id, scope);
    if (!hrCase) {
      return apiError("NOT_FOUND", "HR case not found", 404);
    }
    return NextResponse.json({ case: hrCase });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("HR_CASE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

const patchSchema = z.object({
  contextFields: z.record(z.string(), z.string()).optional(),
  status: z.enum(["dismissed"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid update payload", 400);
  }

  const { id } = await params;
  const hrStore = getHrStore();
  const existing = await hrStore.getCase(id, ctx.scope);
  if (!existing) {
    return apiError("NOT_FOUND", "HR case not found", 404);
  }

  const now = crmNow();
  const updated = await hrStore.setCase({
    ...existing,
    contextFields: parsed.data.contextFields
      ? { ...existing.contextFields, ...parsed.data.contextFields }
      : existing.contextFields,
    status: parsed.data.status ?? existing.status,
    resolvedAt: parsed.data.status === "dismissed" ? now : existing.resolvedAt,
    updatedAt: now,
  });

  return NextResponse.json({ case: updated });
}
