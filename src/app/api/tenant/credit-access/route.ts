import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/request";
import { requireSuperAdminSession } from "@/lib/billing/super-admin";
import { getTenantRepository } from "@/lib/data/tenant-store";

/** Super-admin roster for voice + Email OS credit grants. */
export async function GET() {
  try {
    const ctx = await requireSuperAdminSession();
    const repo = getTenantRepository();
    const [members, workspaces] = await Promise.all([
      repo.listMembersByTenant(ctx.scope.tenantId),
      repo.listWorkspaces(ctx.scope.tenantId),
    ]);

    const workspaceById = new Map(workspaces.map((ws) => [ws.id, ws.name]));

    return NextResponse.json({
      members: members
        .filter((m) => m.status === "active")
        .map((m) => ({
          id: m.id,
          userId: m.userId,
          name: m.name,
          email: m.email,
          role: m.role,
          workspaceId: m.workspaceId,
          workspaceName: workspaceById.get(m.workspaceId) ?? m.workspaceId,
          creditOverrides: {
            unlimitedVoice: Boolean(m.creditOverrides?.unlimitedVoice),
            unlimitedEmailOutreach: Boolean(
              m.creditOverrides?.unlimitedEmailOutreach
            ),
          },
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    const status =
      message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return apiError("CREDIT_ACCESS_ERROR", message, status);
  }
}
