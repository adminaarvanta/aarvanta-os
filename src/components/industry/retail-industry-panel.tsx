import Link from "next/link";
import { ShoppingBag, TrendingUp, Users, Package } from "lucide-react";
import { Panel } from "@/components/ui/os/panel";
import { StatTile } from "@/components/ui/os/stat-tile";
import { getIndustryProfile } from "@/lib/ageb/industries";

export function RetailIndustryPanel({
  businessName,
  storeSlug,
}: {
  businessName?: string;
  storeSlug?: string;
}) {
  const profile = getIndustryProfile("retail_ecommerce");
  if (!profile) return null;

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#F5E6C8]">
            {profile.label} dashboard
          </p>
          <p className="text-xs text-[#A89878]">
            Industry KPIs for {businessName ?? "your business"}
          </p>
        </div>
        {storeSlug ? (
          <Link
            href={`/store/${storeSlug}`}
            className="text-xs font-medium text-[#D4AF37] hover:underline"
            target="_blank"
          >
            View live store →
          </Link>
        ) : null}
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Conversion rate", value: "2.4%", icon: TrendingUp, sub: "Industry benchmark 2.1%" },
          { label: "Avg. order value", value: "£38", icon: ShoppingBag, sub: "Last 30 days (demo)" },
          { label: "Active customers", value: "0", icon: Users, sub: "Awaiting first orders" },
          { label: "SKUs live", value: "3", icon: Package, sub: "From Launch OS catalog" },
        ].map((item) => (
          <StatTile
            key={item.label}
            label={item.label}
            value={item.value}
            sub={item.sub}
          />
        ))}
      </dl>
      <ul className="mt-4 flex flex-wrap gap-2 text-[10px] text-[#A89878]">
        {profile.kpis.map((kpi) => (
          <li key={kpi} className="rounded-full border border-[#3d3528] px-2 py-0.5">
            {kpi.replaceAll("_", " ")}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
