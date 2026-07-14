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
          className="inline-flex items-center gap-2 rounded-lg border border-gold/40 px-3 py-2 text-xs font-medium text-gold-bright hover:bg-gold/10"
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
          <h3 className="mb-3 text-sm font-semibold text-foreground">Volumes</h3>
          <ul className="space-y-2">
            {AGEB_VOLUMES.map((vol) => (
              <li
                key={vol.number}
                className="flex flex-wrap items-start gap-2 rounded-xl border border-border bg-surface-elevated p-3"
              >
                <span className="text-xs font-mono text-gold">V{vol.number}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{vol.title}</p>
                  <p className="text-xs text-muted">{vol.summary}</p>
                </div>
                <StatusPill variant={statusVariant(vol.status)}>{vol.status}</StatusPill>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">System principles (Volume 1)</h3>
          <ul className="grid gap-2 sm:grid-cols-2 text-xs text-muted">
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
                className="rounded-lg border border-border bg-surface-elevated px-3 py-2"
              >
                {principle}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Quick links</h3>
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
                className="rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:border-gold/40"
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
