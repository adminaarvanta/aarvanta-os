import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { crmNewId } from "@/lib/data/crm-helpers";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext, requirePermission } from "@/lib/tenant/context";

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
});

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const repo = getTenantRepository();
    const workspaces = await repo.listWorkspaces(ctx.scope.tenantId);
    return NextResponse.json(workspaces);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("TENANT_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("workspace:manage");
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid workspace payload", 400);
    }

    const slug =
      parsed.data.slug ??
      parsed.data.name.toLowerCase().replace(/\s+/g, "-").slice(0, 32);

    const repo = getTenantRepository();
    const workspace = await repo.createWorkspace({
      tenantId: ctx.scope.tenantId,
      name: parsed.data.name,
      slug,
      defaultCompanyId: crmNewId("company"),
    });
    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return apiError("TENANT_ERROR", message, status);
  }
}
