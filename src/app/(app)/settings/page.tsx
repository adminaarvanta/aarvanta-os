import { Settings } from "lucide-react";
import { SettingsClient } from "@/components/tenant/settings-client";
import { PageFrame, PageScroll } from "@/components/layout/page-scroll";
import { PageHeader } from "@/components/ui/os/page-header";
import { getAiRuntimeStatus } from "@/lib/ai/config";
import { getAllChannelStatuses } from "@/lib/channels/config";
import {
  checkResendReceivingAccess,
  getEmailInboundConfig,
} from "@/lib/channels/resend-client";
import { getActiveDatastore } from "@/lib/data/datastore";
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

  const [workspaces, members, invitations, workspaceSettings, receivingStatus] =
    await Promise.all([
      repo.listWorkspaces(ctx.scope.tenantId),
      repo.listMembers(ctx.scope),
      repo.listInvitations(ctx.scope),
      getWorkspaceSettings(ctx.scope.workspaceId),
      checkResendReceivingAccess(),
    ]);

  await hydrateWorkspaceSettingsCache(ctx.scope.workspaceId);

  const emailInbound = getEmailInboundConfig();

  return (
    <PageFrame>
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Organization, workspace, team access, and global automation for this workspace."
      />
      <PageScroll className="p-4 sm:p-6">
        <SettingsClient
          organization={organization}
          workspace={workspace}
          workspaces={workspaces}
          members={members}
          invitations={invitations}
          currentUserId={ctx.userId}
          currentRole={ctx.role}
          currentEmail={ctx.email}
          currentName={ctx.name}
          permissions={permissionsForRole(ctx.role)}
          workspaceSettings={workspaceSettings}
          systemStatus={{
            mode: isProductionMode() ? "production" : "demo",
            datastore: getActiveDatastore(),
            ai: getAiRuntimeStatus(),
            channels: getAllChannelStatuses(),
            emailReceiving: receivingStatus,
            emailFrom: emailInbound.from ?? null,
            replyTo: emailInbound.replyTo ?? null,
          }}
          production={isProductionMode()}
        />
      </PageScroll>
    </PageFrame>
  );
}

export const metadata = { title: "Settings" };
