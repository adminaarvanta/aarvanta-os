import { ShoppingBag } from "lucide-react";
import { MarketplaceClient } from "@/components/platform/marketplace-client";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getMarketplaceStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function MarketplacePage() {
  const scope = await getTenantScope();
  const marketplaceStore = getMarketplaceStore();
  const [catalog, installed] = await Promise.all([
    Promise.resolve(marketplaceStore.listMarketplaceAgents()),
    marketplaceStore.list(scope),
  ]);

  return (
    <ModulePageShell
      icon={ShoppingBag}
      title="Agent Marketplace"
      description="Discover catalog agents, install them, and manage active deployments."
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            { label: "Catalog agents", value: catalog.length, sub: "Available listings" },
            { label: "Installed", value: installed.length, sub: "Tenant installations" },
            {
              label: "Enabled",
              value: installed.filter((agent) => agent.enabled).length,
              sub: "Active agent installs",
            },
            {
              label: "Paid listings",
              value: catalog.filter((agent) => agent.price === "paid").length,
              sub: "Premium catalog offers",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Install agents</h3>
          <MarketplaceClient
            catalog={catalog}
            installedIds={installed.map((agent) => agent.marketplaceId)}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Installed agents</h3>
          <CardList
            items={installed.map((agent) => ({
              id: agent.id,
              title: agent.name,
              meta: `Installed ${new Date(agent.installedAt).toLocaleDateString()}`,
              badge: agent.enabled ? "enabled" : "disabled",
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Marketplace" };
