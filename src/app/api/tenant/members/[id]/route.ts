import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext, requirePermission } from "@/lib/tenant/context";

const patchSchema = z.object({
  role: z.enum(["admin", "manager", "member", "guest"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePermission("members:manage");
    const { id } = await params;
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid member payload", 400);
    }

    const repo = getTenantRepository();
    const member = await repo.getMember(id, ctx.scope);
    if (!member) return apiError("NOT_FOUND", "Member not found", 404);
    if (member.userId === ctx.userId && parsed.data.role !== member.role) {
      return apiError("FORBIDDEN", "Cannot change your own role", 403);
    }

    const updated = await repo.updateMemberRole(id, parsed.data.role, ctx.scope);
    if (!updated) {
      return apiError("FORBIDDEN", "Cannot update member role", 403);
    }
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return apiError("TENANT_ERROR", message, status);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePermission("members:manage");
    const { id } = await params;
    const repo = getTenantRepository();
    const member = await repo.getMember(id, ctx.scope);
    if (!member) return apiError("NOT_FOUND", "Member not found", 404);
    if (member.userId === ctx.userId) {
      return apiError("FORBIDDEN", "Cannot remove yourself", 403);
    }

    const ok = await repo.removeMember(id, ctx.scope);
    if (!ok) return apiError("FORBIDDEN", "Cannot remove member", 403);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Remove failed";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return apiError("TENANT_ERROR", message, status);
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getSessionContext();
    const { id } = await params;
    const repo = getTenantRepository();
    const member = await repo.getMember(id, ctx.scope);
    if (!member) return apiError("NOT_FOUND", "Member not found", 404);
    return NextResponse.json(member);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("TENANT_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
