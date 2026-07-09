import { AppShell } from "@/components/layout/app-shell";
import { ensureDatastoreReady } from "@/lib/data/datastore";
import { isProductionMode } from "@/lib/config/app-mode";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureDatastoreReady();
  const production = isProductionMode();
  let tenant = null;

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
    const { hydrateWorkspaceSettingsCache } = await import("@/lib/hr/settings");
    await hydrateWorkspaceSettingsCache(bootstrapped.workspace.id);
  } catch {
    /* tenant context unavailable */
  }

  return (
    <AppShell production={production} tenant={tenant}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </AppShell>
  );
}
