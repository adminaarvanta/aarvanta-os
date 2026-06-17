import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext, requirePermission } from "@/lib/tenant/context";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  plan: z.enum(["starter", "growth", "enterprise"]).optional(),
});

export async function PATCH(req: Request) {
  try {
    const ctx = await requirePermission("org:manage");
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid organization payload", 400);
    }

    const repo = getTenantRepository();
    const updated = await repo.updateOrganization(ctx.scope.tenantId, parsed.data);
    if (!updated) {
      return apiError("NOT_FOUND", "Organization not found", 404);
    }
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return apiError("TENANT_ERROR", message, status);
  }
}

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const repo = getTenantRepository();
    const org = await repo.getOrganization(ctx.scope.tenantId);
    if (!org) return apiError("NOT_FOUND", "Organization not found", 404);
    return NextResponse.json(org);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("TENANT_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
