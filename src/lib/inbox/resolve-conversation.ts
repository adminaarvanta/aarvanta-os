import { inScope } from "@/lib/data/conversation-helpers";
import { getRepository } from "@/lib/data/repository";
import { switchSessionToScope } from "@/lib/tenant/switch-session-scope";
import type { Conversation, TenantScope } from "@/types/communication";

export type ResolvedConversation =
  | { conversation: Conversation; scope: TenantScope; switchedWorkspace: false }
  | { conversation: null; scope: TenantScope; switchedWorkspace: true };

/**
 * Load a conversation for the inbox detail page.
 * Switches workspace when the conversation lives in another workspace in the same tenant.
 */
export async function resolveConversationForInbox(
  id: string,
  scope: TenantScope
): Promise<ResolvedConversation | null> {
  const repo = getRepository();
  const scoped = await repo.getConversation(id, scope);
  if (scoped) {
    return { conversation: scoped, scope, switchedWorkspace: false };
  }

  const byId = await repo.getConversationById(id);
  if (!byId || byId.tenantId !== scope.tenantId) return null;

  if (inScope(byId, scope)) {
    return { conversation: byId, scope, switchedWorkspace: false };
  }

  const targetScope: TenantScope = {
    tenantId: byId.tenantId,
    workspaceId: byId.workspaceId,
    companyId: byId.companyId,
  };

  const switched = await switchSessionToScope(targetScope);
  if (!switched) return null;

  return { conversation: null, scope: targetScope, switchedWorkspace: true };
}
