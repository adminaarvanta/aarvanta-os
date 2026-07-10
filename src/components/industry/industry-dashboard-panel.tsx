import Link from "next/link";
import { getIndustryProfile } from "@/lib/ageb/industries";
import { getIndustryKpis } from "@/lib/industry/kpis";
import { Panel } from "@/components/ui/os/panel";
import { StatTile } from "@/components/ui/os/stat-tile";

export function IndustryDashboardPanel({
  industryProfileId,
  businessName,
  storeSlug,
}: {
  industryProfileId: string;
  businessName?: string;
  storeSlug?: string;
}) {
  const profile = getIndustryProfile(industryProfileId);
  if (!profile) return null;

  const { metrics } = getIndustryKpis(industryProfileId);

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#FFFFFF]">
            {profile.label} dashboard
          </p>
          <p className="text-xs text-[#9AABC4]">
            Industry KPIs for {businessName ?? "your business"}
          </p>
        </div>
        {storeSlug && industryProfileId === "retail_ecommerce" ? (
          <Link
            href={`/store/${storeSlug}`}
            className="text-xs font-medium text-[#B8965D] hover:underline"
            target="_blank"
          >
            View live store →
          </Link>
        ) : null}
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((item) => (
          <StatTile
            key={item.label}
            label={item.label}
            value={item.value}
            sub={item.benchmark}
          />
        ))}
      </dl>
      <ul className="mt-4 flex flex-wrap gap-2 text-[10px] text-[#9AABC4]">
        {profile.kpis.map((kpi) => (
          <li key={kpi} className="rounded-full border border-[#243656] px-2 py-0.5">
            {kpi.replaceAll("_", " ")}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
