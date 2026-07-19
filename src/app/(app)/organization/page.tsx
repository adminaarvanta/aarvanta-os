import { Network } from "lucide-react";
import { OrgHierarchyClient } from "@/components/tenant/org-hierarchy-client";
import { PageFrame, PageScroll } from "@/components/layout/page-scroll";
import { PageHeader } from "@/components/ui/os/page-header";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { buildOrganizationHierarchy, roleCatalog } from "@/lib/tenant/hierarchy";
import { can } from "@/lib/tenant/permissions";
import { getSessionContext } from "@/lib/tenant/context";
import { ensureTenantRecords } from "@/lib/tenant/ensure-tenant-records";

export default async function OrganizationPage() {
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

  return (
    <PageFrame>
      <PageHeader
        icon={Network}
        title="Organization"
        description="Hierarchy for every user — Organization → Workspace → Owner, Admin, Manager, Member, Guest."
      />
      <PageScroll className="p-4 sm:p-6">
        <OrgHierarchyClient
          hierarchy={hierarchy}
          roles={roleCatalog()}
          current={{
            userId: ctx.userId,
            email: ctx.email,
            name: ctx.name,
            role: ctx.role,
            workspaceId: ctx.scope.workspaceId,
          }}
          canInvite={can(ctx.role, "members:invite")}
          canManageMembers={can(ctx.role, "members:manage")}
        />
      </PageScroll>
    </PageFrame>
  );
}

export const metadata = { title: "Organization" };
