import { Store } from "lucide-react";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getFranchiseStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function FranchisePage() {
  const scope = await getTenantScope();
  const locations = await getFranchiseStore().list(scope);

  const totalRevenue = locations.reduce((sum, location) => sum + location.revenue, 0);
  const averageCompliance =
    locations.length > 0
      ? Math.round(
          locations.reduce((sum, location) => sum + location.complianceScore, 0) /
            locations.length
        )
      : 0;

  return (
    <ModulePageShell
      icon={Store}
      title="Franchise OS"
      description="Track location performance, revenue, and compliance outcomes."
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            { label: "Locations", value: locations.length, sub: "Franchise units" },
            { label: "Revenue", value: formatCurrency(totalRevenue), sub: "Combined performance" },
            { label: "Compliance", value: `${averageCompliance}%`, sub: "Average score" },
            {
              label: "At risk",
              value: locations.filter((location) => location.status === "at_risk").length,
              sub: "Requires intervention",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Location performance</h3>
          <CardList
            items={locations.map((location) => ({
              id: location.id,
              title: `${location.name} · ${location.city}`,
              body: `${formatCurrency(location.revenue)} revenue · ${location.complianceScore}% compliance`,
              badge: location.status,
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Franchise" };
