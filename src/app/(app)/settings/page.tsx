import { Settings } from "lucide-react";
import { SettingsClient } from "@/components/tenant/settings-client";
import { PageFrame, PageScroll } from "@/components/layout/page-scroll";
import { PageHeader } from "@/components/ui/os/page-header";
import { isProductionMode } from "@/lib/config/app-mode";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import { hydrateWorkspaceSettingsCache } from "@/lib/hr/settings";
import { getSessionContext } from "@/lib/tenant/context";
import { ensureTenantRecords } from "@/lib/tenant/ensure-tenant-records";
import { permissionsForRole } from "@/lib/tenant/permissions";

export default async function SettingsPage() {
  const ctx = await getSessionContext();
  const { organization, workspace } = await ensureTenantRecords(ctx);
  const repo = getTenantRepository();

  const [workspaces, workspaceSettings] = await Promise.all([
    repo.listWorkspaces(ctx.scope.tenantId),
    getWorkspaceSettings(ctx.scope.workspaceId),
  ]);

  await hydrateWorkspaceSettingsCache(ctx.scope.workspaceId);

  return (
    <PageFrame>
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Organization, workspaces, account, and automation for this workspace."
      />
      <PageScroll className="p-4 sm:p-6">
        <SettingsClient
          organization={organization}
          workspace={workspace}
          workspaces={workspaces}
          currentRole={ctx.role}
          currentEmail={ctx.email}
          currentName={ctx.name}
          permissions={permissionsForRole(ctx.role)}
          workspaceSettings={workspaceSettings}
          production={isProductionMode()}
        />
      </PageScroll>
    </PageFrame>
  );
}

export const metadata = { title: "Settings" };
