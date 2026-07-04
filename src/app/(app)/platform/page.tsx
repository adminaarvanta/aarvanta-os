import Link from "next/link";
import { Activity, ClipboardCheck, LayoutGrid } from "lucide-react";
import {
  CORE_MODULES,
  PLATFORM_MODULES,
} from "@/lib/platform/modules";
import { coverageStats } from "@/lib/platform/spec-coverage";
import { ModulePageShell } from "@/components/platform/module-page-shell";

function ModuleGrid({
  modules,
  phasePrefix,
}: {
  modules: typeof CORE_MODULES;
  phasePrefix?: string;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((mod) => {
        const Icon = mod.icon;
        return (
          <li key={mod.id}>
            <Link
              href={mod.href}
              className="flex h-full flex-col rounded-xl border border-[#3d3528] bg-[#101010] p-4 transition-colors hover:border-[#D4AF37]/40 hover:bg-[#141414]"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#D4AF37]" />
                <span className="font-medium text-[#F5E6C8]">{mod.label}</span>
                <span className="ml-auto text-[10px] text-[#A89878]">
                  {phasePrefix ?? "M"}
                  {mod.phase}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#A89878]">{mod.description}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function PlatformHubPage() {
  const stats = coverageStats();
  const groups = ["Revenue", "Intelligence", "Operations", "Enterprise"] as const;

  return (
    <ModulePageShell
      icon={LayoutGrid}
      title="Platform Modules"
      description="All Aarvanta OS modules mapped to os-new.txt"
    >
      <div className="space-y-8">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#3d3528] bg-[#101010] p-4">
          <div>
            <p className="text-sm font-medium text-[#F5E6C8]">Roadmap coverage</p>
            <p className="text-xs text-[#A89878]">
              {stats.complete} complete · {stats.partial} partial · {stats.planned}{" "}
              planned
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
          <Link
            href="/platform/events"
            className="inline-flex items-center gap-2 rounded-lg border border-[#3d3528] px-3 py-2 text-xs font-medium text-[#F5E6C8] hover:border-[#D4AF37]/40"
          >
            <Activity className="h-3.5 w-3.5 text-[#D4AF37]" />
            Event audit log
          </Link>
          <Link
            href="/platform/ageb"
            className="inline-flex items-center gap-2 rounded-lg border border-[#3d3528] px-3 py-2 text-xs font-medium text-[#F5E6C8] hover:border-[#D4AF37]/40"
          >
            AGEB 2.0 blueprint
          </Link>
          <Link
            href="/platform/coverage"
            className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/40 px-3 py-2 text-xs font-medium text-[#F9E076] hover:bg-[#D4AF37]/10"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            View full coverage report
          </Link>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Core (Phase 1–10)</h3>
          <ModuleGrid modules={CORE_MODULES} phasePrefix="" />
        </section>

        {groups.map((group) => {
          const modules = PLATFORM_MODULES.filter((m) => m.group === group);
          return (
            <section key={group}>
              <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">{group}</h3>
              <ModuleGrid modules={modules} />
            </section>
          );
        })}
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Platform" };
