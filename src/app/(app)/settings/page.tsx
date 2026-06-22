import { Settings } from "lucide-react";
import { SettingsClient } from "@/components/tenant/settings-client";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { permissionsForRole } from "@/lib/tenant/permissions";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const ctx = await getSessionContext();
  const repo = getTenantRepository();

  const [org, workspaces, members, invitations] = await Promise.all([
    repo.getOrganization(ctx.scope.tenantId),
    repo.listWorkspaces(ctx.scope.tenantId),
    repo.listMembers(ctx.scope),
    repo.listInvitations(ctx.scope),
  ]);

  const workspace = workspaces.find((w) => w.id === ctx.scope.workspaceId);
  if (!org || !workspace) {
    redirect("/dashboard");
  }

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#F5E6C8] sm:text-xl">
          <Settings className="h-5 w-5 text-[#D4AF37]" />
          Settings
        </h2>
        <p className="text-xs text-[#A89878] sm:text-sm">
          Organization, workspaces, team, invitations, and RBAC.
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <SettingsClient
          organization={org}
          workspace={workspace}
          workspaces={workspaces}
          members={members}
          invitations={invitations}
          currentUserId={ctx.userId}
          currentRole={ctx.role}
          permissions={permissionsForRole(ctx.role)}
        />
      </div>
    </>
  );
}

export const metadata = { title: "Settings" };
