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
  complete: "bg-emerald-950/40 text-emerald-300 ring-emerald-800/50",
  partial: "bg-amber-950/40 text-amber-200 ring-amber-800/50",
  planned: "bg-[#141414] text-[#A89878] ring-[#3d3528]",
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
    <li className="rounded-xl border border-[#3d3528] bg-[#101010] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-[#F5E6C8]">
            {module.href ? (
              <Link href={module.href} className="hover:text-[#F9E076]">
                {module.name}
              </Link>
            ) : (
              module.name
            )}
          </p>
          <p className="mt-1 text-xs text-[#A89878]">Phase {module.phase}</p>
        </div>
        <StatusBadge status={module.status} />
      </div>
      <p className="mt-2 text-sm text-[#A89878]">{module.summary}</p>
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
              className="rounded-xl border border-[#3d3528] bg-[#101010] p-4"
            >
              <p className="text-[10px] uppercase tracking-wide text-[#A89878]">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#F5E6C8]">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <p className="text-sm text-[#A89878]">
          <strong className="text-[#F5E6C8]">Complete</strong> = spec MVP delivered
          in app. <strong className="text-[#F5E6C8]">Partial</strong> = UI +
          demo/API scaffold; live third-party hooks or advanced features pending.{" "}
          <strong className="text-[#F5E6C8]">Planned</strong> = roadmap only.
        </p>

        {SPEC_PHASES.map((phase) => (
          <section key={phase.id}>
            <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">
              {phase.label}
            </h3>
            <ul className="space-y-3">
              {phase.modules.map((module) => (
                <ModuleRow key={module.id} module={module} />
              ))}
            </ul>
          </section>
        ))}

        <section className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4">
          <p className="text-sm text-[#F5E6C8]">
            Run the live demo:{" "}
            <Link href="/demo" className="text-[#F9E076] hover:underline">
              /demo
            </Link>{" "}
            · Browse all modules:{" "}
            <Link href="/platform" className="text-[#F9E076] hover:underline">
              /platform
            </Link>
          </p>
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Roadmap Coverage" };
