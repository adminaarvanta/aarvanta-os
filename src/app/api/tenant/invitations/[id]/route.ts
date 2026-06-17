import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/request";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { requirePermission } from "@/lib/tenant/context";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePermission("members:invite");
    const { id } = await params;
    const repo = getTenantRepository();
    const ok = await repo.revokeInvitation(id, ctx.scope);
    if (!ok) return apiError("NOT_FOUND", "Invitation not found", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Revoke failed";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return apiError("TENANT_ERROR", message, status);
  }
}
