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
    const [organization, workspaces] = await Promise.all([
      repo.getOrganization(ctx.scope.tenantId),
      repo.listWorkspaces(ctx.scope.tenantId),
    ]);
    const workspace =
      workspaces.find((w) => w.id === ctx.scope.workspaceId) ?? null;
    if (organization && workspace) {
      tenant = { organization, workspace, workspaces };
    }
  } catch {
    /* tenant context unavailable */
  }

  return (
    <AppShell production={production} tenant={tenant}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </AppShell>
  );
}
