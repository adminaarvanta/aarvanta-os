import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/request";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { buildOrganizationHierarchy, roleCatalog } from "@/lib/tenant/hierarchy";
import { getSessionContext } from "@/lib/tenant/context";
import { ensureTenantRecords } from "@/lib/tenant/ensure-tenant-records";

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const { organization } = await ensureTenantRecords(ctx);
    const repo = getTenantRepository();

    const [workspaces, members, invitations] = await Promise.all([
      repo.listWorkspaces(ctx.scope.tenantId),
      repo.listMembersByTenant(ctx.scope.tenantId),
      repo.listInvitationsByTenant(ctx.scope.tenantId),
    ]);

    const hierarchy = buildOrganizationHierarchy({
      organization,
      workspaces,
      members,
      invitations,
    });

    return NextResponse.json({
      hierarchy,
      roles: roleCatalog(),
      current: {
        userId: ctx.userId,
        email: ctx.email,
        name: ctx.name,
        role: ctx.role,
        workspaceId: ctx.scope.workspaceId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError(
      "TENANT_ERROR",
      message,
      message === "Unauthorized" ? 401 : 500
    );
  }
}
