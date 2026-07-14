import Link from "next/link";
import { Cog } from "lucide-react";
import { AGEB_ENGINES, engineStats } from "@/lib/ageb/engines";
import { ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { StatusPill } from "@/components/ui/os/status-pill";

function statusLabel(status: string) {
  if (status === "live") return "Live";
  if (status === "partial") return "In progress";
  return "Coming soon";
}

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
      description="Reusable systems that power your modules — shown in plain language."
      actions={
        <Link
          href="/platform/ageb"
          className="rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:border-gold/40"
        >
          Platform overview
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
              label: "Ready to use",
              value: stats.live,
              sub: "Fully live engines",
            },
          ]}
        />

        <ul className="grid gap-3 lg:grid-cols-2">
          {AGEB_ENGINES.map((engine) => (
            <li
              key={engine.id}
              className="rounded-xl border border-border bg-surface-elevated p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-foreground">{engine.name}</p>
                <StatusPill variant={statusVariant(engine.status)}>
                  {statusLabel(engine.status)}
                </StatusPill>
              </div>
              <p className="mt-1 text-xs text-muted">{engine.description}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wide text-dim">
                {engine.kind === "os_module"
                  ? "Operating module"
                  : engine.kind === "fabric"
                    ? "Platform fabric"
                    : "Core engine"}
              </p>
              <ul className="mt-2 space-y-0.5 text-[11px] text-muted">
                {engine.capabilities.slice(0, 4).map((cap) => (
                  <li key={cap}>· {cap}</li>
                ))}
              </ul>
              {engine.apiPath && !engine.apiPath.startsWith("/api") && (
                <Link
                  href={engine.apiPath}
                  className="mt-2 inline-block text-[11px] text-gold hover:underline"
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
