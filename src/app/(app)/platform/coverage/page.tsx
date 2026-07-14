import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { ModulePageShell } from "@/components/platform/module-page-shell";
import {
  SPEC_PHASES,
  coverageStats,
  type CoverageStatus,
  type SpecModule,
} from "@/lib/platform/spec-coverage";
import { cn } from "@/lib/utils";

const statusStyles: Record<CoverageStatus, string> = {
  complete: "bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/30",
  partial: "bg-gold/10 text-gold-bright ring-gold/35",
  planned: "bg-surface-muted text-muted ring-border",
};

function StatusBadge({ status }: { status: CoverageStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}

function ModuleRow({ module }: { module: SpecModule }) {
  return (
    <li className="rounded-xl border border-border bg-surface-elevated p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">
            {module.href ? (
              <Link href={module.href} className="hover:text-gold-bright">
                {module.name}
              </Link>
            ) : (
              module.name
            )}
          </p>
          <p className="mt-1 text-xs text-muted">Phase {module.phase}</p>
        </div>
        <StatusBadge status={module.status} />
      </div>
      <p className="mt-2 text-sm text-muted">{module.summary}</p>
    </li>
  );
}

export default function PlatformCoveragePage() {
  const stats = coverageStats();

  return (
    <ModulePageShell
      icon={ClipboardCheck}
      title="Roadmap Coverage"
      description="Alignment with os-new.txt — what is complete, partial, or planned."
    >
      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total modules", value: stats.total },
            { label: "Complete", value: stats.complete },
            { label: "Partial", value: stats.partial },
            { label: "Planned", value: stats.planned },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-surface-elevated p-4"
            >
              <p className="text-[10px] uppercase tracking-wide text-muted">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <p className="text-sm text-muted">
          <strong className="text-foreground">Complete</strong> = spec MVP delivered
          in app. <strong className="text-foreground">Partial</strong> = UI +
          demo/API scaffold; live third-party hooks or advanced features pending.{" "}
          <strong className="text-foreground">Planned</strong> = roadmap only.
        </p>

        {SPEC_PHASES.map((phase) => (
          <section key={phase.id}>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {phase.label}
            </h3>
            <ul className="space-y-3">
              {phase.modules.map((module) => (
                <ModuleRow key={module.id} module={module} />
              ))}
            </ul>
          </section>
        ))}

        <section className="rounded-xl border border-gold/30 bg-gold/5 p-4">
          <p className="text-sm text-foreground">
            Run the live demo:{" "}
            <Link href="/dashboard?help=open" className="text-gold-bright hover:underline">
              Help (header)
            </Link>{" "}
            · Browse all modules:{" "}
            <Link href="/platform" className="text-gold-bright hover:underline">
              /platform
            </Link>
          </p>
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Roadmap Coverage" };
