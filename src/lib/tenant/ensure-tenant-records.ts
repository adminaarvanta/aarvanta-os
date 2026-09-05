import { getCompanyLegalName } from "@/lib/config/company-profile";
import { crmNow } from "@/lib/data/crm-helpers";
import { getTenantRepository } from "@/lib/data/tenant-store";
import type { SessionContext } from "@/lib/tenant/context";
import type { Organization, Workspace } from "@/types/tenant";

function slugFromId(id: string) {
  return id.replace(/_/g, "-").slice(0, 48) || "workspace";
}

/** Ensure org, workspace, and owner membership exist for production env scope. */
export async function ensureTenantRecords(
  ctx: SessionContext
): Promise<{ organization: Organization; workspace: Workspace }> {
  const repo = getTenantRepository();
  const { scope } = ctx;
  const now = crmNow();

  let organization = await repo.getOrganization(scope.tenantId);
  if (!organization) {
    organization = await repo.upsertOrganization({
      id: scope.tenantId,
      name: getCompanyLegalName(),
      slug: slugFromId(scope.tenantId),
      plan: "free",
      createdAt: now,
      updatedAt: now,
    });
  }

  let workspace = await repo.getWorkspace(scope.workspaceId);
  if (!workspace) {
    workspace = await repo.upsertWorkspace({
      id: scope.workspaceId,
      tenantId: scope.tenantId,
      name: process.env.WORKSPACE_NAME?.trim() || "Main workspace",
      slug: slugFromId(scope.workspaceId),
      defaultCompanyId: scope.companyId,
      createdAt: now,
      updatedAt: now,
    });
  }

  const membership = await repo.getMemberByUser(ctx.userId, scope);
  if (!membership) {
    let creditOverrides: import("@/types/tenant").MemberCreditOverrides | undefined;
    try {
      const { resolveCreditOverridesForSession } = await import(
        "@/lib/billing/member-credits"
      );
      const resolved = await resolveCreditOverridesForSession({
        email: ctx.email,
        member: ctx.member,
      });
      if (resolved.unlimitedVoice || resolved.unlimitedEmailOutreach) {
        creditOverrides = resolved;
      }
    } catch {
      /* best-effort — grants still resolve via email store on read */
    }

    await repo.createMember(
      {
        userId: ctx.userId,
        email: ctx.email,
        name: ctx.name,
        role: ctx.role,
        ...(creditOverrides ? { creditOverrides } : {}),
      },
      scope
    );
  }

  return { organization, workspace };
}
