import { persistScope } from "@/lib/data/crm-helpers";
import type { TenantScope } from "@/types/communication";
import type { CallCampaign } from "@/types/calling-agent";

/** Workspace-only scope so cron can read records regardless of owner isolation. */
export function campaignWorkspaceScope(item: {
  tenantId: string;
  workspaceId: string;
  companyId: string;
}): TenantScope {
  return {
    tenantId: item.tenantId,
    workspaceId: item.workspaceId,
    companyId: item.companyId,
  };
}

/** Stamp sessions / conversations with the campaign or queue owner. */
export function campaignWriteScope(
  item: TenantScope,
  campaign?: Pick<CallCampaign, "ownerUserId" | "createdBy">
): TenantScope {
  return persistScope({
    ...campaignWorkspaceScope(item),
    ownerUserId: item.ownerUserId ?? campaign?.ownerUserId ?? campaign?.createdBy,
  });
}
