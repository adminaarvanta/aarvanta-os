import { Users } from "lucide-react";
import { TeamClient } from "@/components/team/team-client";
import { PageFrame, PageScroll } from "@/components/layout/page-scroll";
import { PageHeader } from "@/components/ui/os/page-header";
import { getTeamRepository } from "@/lib/data/team-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { can } from "@/lib/tenant/permissions";
import { getSessionContext } from "@/lib/tenant/context";
import { ensureTenantRecords } from "@/lib/tenant/ensure-tenant-records";
import { buildOrganizationHierarchy, roleCatalog } from "@/lib/tenant/hierarchy";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const ctx = await getSessionContext();
  const { tab } = await searchParams;
  const teamRepo = getTeamRepository();
  const tenantRepo = getTenantRepository();
  const { organization } = await ensureTenantRecords(ctx);

  const [notes, comments, activity, workspaceMembers, workspaceInvitations, workspaces, tenantMembers, tenantInvitations] =
    await Promise.all([
      teamRepo.listNotes(ctx.scope),
      teamRepo.listComments(ctx.scope),
      teamRepo.listActivity(ctx.scope),
      tenantRepo.listMembers(ctx.scope),
      tenantRepo.listInvitations(ctx.scope),
      tenantRepo.listWorkspaces(ctx.scope.tenantId),
      tenantRepo.listMembersByTenant(ctx.scope.tenantId),
      tenantRepo.listInvitationsByTenant(ctx.scope.tenantId),
    ]);

  const hierarchy = buildOrganizationHierarchy({
    organization,
    workspaces,
    members: tenantMembers,
    invitations: tenantInvitations,
  });

  return (
    <PageFrame>
      <PageHeader
        icon={Users}
        title="Team"
        description="People, roles, and collaboration across this organization."
      />
      <PageScroll className="p-4 sm:p-6">
        <TeamClient
          members={workspaceMembers}
          notes={notes}
          comments={comments}
          activity={activity}
          currentUserId={ctx.userId}
          invitations={workspaceInvitations}
          canInvite={can(ctx.role, "members:invite")}
          canManageMembers={can(ctx.role, "members:manage")}
          hierarchy={hierarchy}
          roles={roleCatalog()}
          current={{
            userId: ctx.userId,
            email: ctx.email,
            name: ctx.name,
            role: ctx.role,
            workspaceId: ctx.scope.workspaceId,
          }}
          initialTab={tab}
        />
      </PageScroll>
    </PageFrame>
  );
}

export const metadata = { title: "Team" };
