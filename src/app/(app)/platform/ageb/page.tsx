import Link from "next/link";
import { BookOpen, Cog } from "lucide-react";
import { AGEB_VOLUMES, volumeStats } from "@/lib/ageb/volumes";
import { engineStats } from "@/lib/ageb/engines";
import { AI_BUDDIES } from "@/lib/ageb/buddies";
import { ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { StatusPill } from "@/components/ui/os/status-pill";

function statusVariant(
  status: string
): "success" | "warning" | "default" | "danger" {
  if (status === "live" || status === "complete") return "success";
  if (status === "partial") return "warning";
  return "default";
}

export default function AgebBlueprintPage() {
  const volStats = volumeStats();
  const engStats = engineStats();

  return (
    <ModulePageShell
      icon={BookOpen}
      title="AGEB 2.0 Blueprint"
      description="Global Architecture & Engineering Blueprint — constitution, engines, and implementation status"
      actions={
        <Link
          href="/platform/engines"
          className="inline-flex items-center gap-2 rounded-lg border border-[#B8965D]/40 px-3 py-2 text-xs font-medium text-[#C9AA72] hover:bg-[#B8965D]/10"
        >
          <Cog className="h-3.5 w-3.5" />
          Core engines
        </Link>
      }
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            { label: "AGEB volumes", value: volStats.total, sub: `${volStats.partial} partial` },
            { label: "Core engines", value: engStats.total, sub: `${engStats.partial} partial` },
            { label: "AI Buddies", value: AI_BUDDIES.length, sub: "Role-based agents" },
            { label: "Business Action API", value: "v1", sub: "/api/v1/action/execute", href: "/launch" },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Volumes</h3>
          <ul className="space-y-2">
            {AGEB_VOLUMES.map((vol) => (
              <li
                key={vol.number}
                className="flex flex-wrap items-start gap-2 rounded-xl border border-[#243656] bg-[#0D1524] p-3"
              >
                <span className="text-xs font-mono text-[#B8965D]">V{vol.number}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#FFFFFF]">{vol.title}</p>
                  <p className="text-xs text-[#9AABC4]">{vol.summary}</p>
                </div>
                <StatusPill variant={statusVariant(vol.status)}>{vol.status}</StatusPill>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">System principles (Volume 1)</h3>
          <ul className="grid gap-2 sm:grid-cols-2 text-xs text-[#9AABC4]">
            {[
              "Global first — countries, languages, currencies",
              "AI-native — workers, not assistants",
              "No hardcoding — data-driven rule packs",
              "Modular — engines, frameworks, buddies, fabric",
              "Event-driven everything",
              "Single source of truth per entity",
              "Explainable intelligence with audit trail",
              "Human override authority",
            ].map((principle) => (
              <li
                key={principle}
                className="rounded-lg border border-[#243656] bg-[#0D1524] px-3 py-2"
              >
                {principle}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Quick links</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/launch", label: "Launch OS" },
              { href: "/platform/engines", label: "Engines" },
              { href: "/workforce", label: "AI Buddies / Workforce" },
              { href: "/platform/events", label: "Event audit" },
              { href: "/governance", label: "Governance" },
              { href: "/regions", label: "Multi-region" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-[#243656] px-3 py-2 text-xs text-[#FFFFFF] hover:border-[#B8965D]/40"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "AGEB Blueprint" };
