import { AppShell } from "@/components/layout/app-shell";
import { ensureDatastoreReady } from "@/lib/data/datastore";
import { getRepository } from "@/lib/data/repository";
import { isProductionMode } from "@/lib/config/app-mode";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { ROLE_LABELS } from "@/types/tenant";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureDatastoreReady();
  const production = isProductionMode();
  let tenant = null;
  let userName = "Founder";
  let userRole = "Owner";
  let inboxUnread = 0;

  try {
    const ctx = await getSessionContext();
    const repo = getTenantRepository();
    const { ensureTenantRecords } = await import("@/lib/tenant/ensure-tenant-records");
    const { ensureProductionBootstrap } = await import(
      "@/lib/tenant/ensure-production-bootstrap"
    );
    const bootstrapped = await ensureTenantRecords(ctx);
    await ensureProductionBootstrap();
    const workspaces = await repo.listWorkspaces(ctx.scope.tenantId);
    tenant = {
      organization: bootstrapped.organization,
      workspace: bootstrapped.workspace,
      workspaces,
    };
    userName = ctx.name || ctx.email.split("@")[0] || "Founder";
    userRole = ROLE_LABELS[ctx.role] ?? ctx.role;
    const conversations = await getRepository().listConversations(ctx.scope);
    inboxUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
    const { hydrateWorkspaceSettingsCache } = await import("@/lib/hr/settings");
    await hydrateWorkspaceSettingsCache(bootstrapped.workspace.id);
  } catch {
    /* tenant context unavailable */
  }

  return (
    <AppShell
      production={production}
      tenant={tenant}
      userName={userName}
      userRole={userRole}
      inboxUnread={inboxUnread}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black">{children}</div>
    </AppShell>
  );
}
