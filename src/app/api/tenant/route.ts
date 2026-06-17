import { NextResponse } from "next/server";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { permissionsForRole } from "@/lib/tenant/permissions";

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const repo = getTenantRepository();
    const [org, workspaces, members, invitations] = await Promise.all([
      repo.getOrganization(ctx.scope.tenantId),
      repo.listWorkspaces(ctx.scope.tenantId),
      repo.listMembers(ctx.scope),
      repo.listInvitations(ctx.scope),
    ]);
    const workspace = workspaces.find((w) => w.id === ctx.scope.workspaceId) ?? null;

    return NextResponse.json({
      user: {
        userId: ctx.userId,
        email: ctx.email,
        name: ctx.name,
        role: ctx.role,
      },
      scope: ctx.scope,
      organization: org,
      workspace,
      workspaces,
      members,
      invitations,
      permissions: permissionsForRole(ctx.role),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load tenant";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: { code: "TENANT_ERROR", message } }, { status });
  }
}
