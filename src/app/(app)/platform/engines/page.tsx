import Link from "next/link";
import { Cog } from "lucide-react";
import { AGEB_ENGINES, engineStats } from "@/lib/ageb/engines";
import { ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { StatusPill } from "@/components/ui/os/status-pill";

function statusVariant(
  status: string
): "success" | "warning" | "default" | "danger" {
  if (status === "live") return "success";
  if (status === "partial") return "warning";
  return "default";
}

export default function EnginesPage() {
  const stats = engineStats();

  return (
    <ModulePageShell
      icon={Cog}
      title="Core Engines"
      description="AGEB Volume 3 — reusable systems powering all OS modules"
      actions={
        <Link
          href="/platform/ageb"
          className="rounded-lg border border-[#3d3528] px-3 py-2 text-xs text-[#F5E6C8] hover:border-[#D4AF37]/40"
        >
          AGEB blueprint
        </Link>
      }
    >
      <div className="space-y-6">
        <StatGrid
          items={[
            { label: "Total engines", value: stats.total },
            { label: "Partial / live", value: stats.partial + stats.live },
            { label: "Planned", value: stats.planned },
            {
              label: "Action API",
              value: "POST",
              sub: "/api/v1/action/execute",
            },
          ]}
        />

        <ul className="grid gap-3 lg:grid-cols-2">
          {AGEB_ENGINES.map((engine) => (
            <li
              key={engine.id}
              className="rounded-xl border border-[#3d3528] bg-[#101010] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-[#F5E6C8]">{engine.name}</p>
                <StatusPill variant={statusVariant(engine.status)}>{engine.status}</StatusPill>
              </div>
              <p className="mt-1 text-xs text-[#A89878]">{engine.description}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wide text-[#6B5D48]">
                Vol. {engine.volume} · {engine.kind}
              </p>
              <ul className="mt-2 space-y-0.5 text-[11px] text-[#A89878]">
                {engine.capabilities.slice(0, 4).map((cap) => (
                  <li key={cap}>· {cap}</li>
                ))}
              </ul>
              {engine.apiPath && (
                <Link
                  href={engine.apiPath}
                  className="mt-2 inline-block text-[11px] text-[#D4AF37] hover:underline"
                >
                  Open module →
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Core Engines" };
