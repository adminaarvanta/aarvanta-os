import { Globe } from "lucide-react";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { listRegions, listTenantRegions } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function RegionsPage() {
  const scope = await getTenantScope();
  const [regions, tenantRegions] = await Promise.all([
    Promise.resolve(listRegions()),
    listTenantRegions(scope),
  ]);

  const primaryTenantRegion = tenantRegions.find((region) => region.primary);

  return (
    <ModulePageShell
      icon={Globe}
      title="Multi-Region"
      description="Global infrastructure regions with tenant-level residency assignment."
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            { label: "Global regions", value: regions.length, sub: "Available locations" },
            {
              label: "Active regions",
              value: regions.filter((region) => region.status === "active").length,
              sub: "Production ready",
            },
            {
              label: "Tenant regions",
              value: tenantRegions.length,
              sub: "Tenant allocations",
            },
            {
              label: "Primary",
              value: primaryTenantRegion?.regionCode.toUpperCase() ?? "N/A",
              sub: "Primary tenant region",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Global region map</h3>
          <CardList
            items={regions.map((region) => ({
              id: region.id,
              title: `${region.name} (${region.code.toUpperCase()})`,
              body: `${region.latencyMs}ms latency · Data residency ${
                region.dataResidency ? "enabled" : "disabled"
              }`,
              badge: region.status,
            }))}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Tenant assignments</h3>
          <CardList
            items={tenantRegions.map((tenantRegion) => ({
              id: tenantRegion.id,
              title: `${tenantRegion.regionCode.toUpperCase()} assignment`,
              body: tenantRegion.primary ? "Primary region" : "Failover region",
              badge: tenantRegion.status,
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Regions" };
