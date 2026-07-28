import Link from "next/link";
import { Activity, ClipboardCheck, LayoutGrid } from "lucide-react";
import {
  CORE_MODULES,
  PLATFORM_MODULES,
} from "@/lib/platform/modules";
import { DEFERRED_TOOLS, isDeferredToolId } from "@/lib/navigation/deferred-tools";
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
              className="flex h-full flex-col rounded-xl border border-border bg-surface-elevated p-4 transition-colors hover:border-gold/40 hover:bg-surface-muted"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-gold" />
                <span className="font-medium text-foreground">{mod.label}</span>
                <span className="ml-auto text-[10px] text-muted">
                  {phasePrefix ?? "M"}
                  {mod.phase}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">{mod.description}</p>
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
  const activeCore = CORE_MODULES.filter((m) => !isDeferredToolId(m.id));
  const activePlatform = PLATFORM_MODULES.filter((m) => !isDeferredToolId(m.id));

  return (
    <ModulePageShell
      icon={LayoutGrid}
      title="Platform Modules"
      description="All Aarvanta OS modules mapped to os-new.txt"
    >
      <div className="space-y-8">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated p-4">
          <div>
            <p className="text-sm font-medium text-foreground">Roadmap coverage</p>
            <p className="text-xs text-muted">
              {stats.complete} complete · {stats.partial} partial · {stats.planned}{" "}
              planned
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
          <Link
            href="/platform/events"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:border-gold/40"
          >
            <Activity className="h-3.5 w-3.5 text-gold" />
            Event audit log
          </Link>
          <Link
            href="/platform/ageb"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:border-gold/40"
          >
            AGEB 2.0 blueprint
          </Link>
          <Link
            href="/platform/coverage"
            className="inline-flex items-center gap-2 rounded-lg border border-gold/40 px-3 py-2 text-xs font-medium text-gold-bright hover:bg-gold/10"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            View full coverage report
          </Link>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Core (Phase 1–10)</h3>
          <ModuleGrid modules={activeCore} phasePrefix="" />
        </section>

        {groups.map((group) => {
          const modules = activePlatform.filter((m) => m.group === group);
          if (!modules.length) return null;
          return (
            <section key={group}>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{group}</h3>
              <ModuleGrid modules={modules} />
            </section>
          );
        })}

        <section>
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            Deferred (hidden from All Tools)
          </h3>
          <p className="mb-3 text-xs text-muted">
            Incomplete shells — backlog in{" "}
            <code className="text-[11px]">docs/DEFERRED_TOOLS.md</code>. Routes still
            exist for engineering work.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DEFERRED_TOOLS.map((tool) => (
              <li
                key={tool.id}
                className="rounded-xl border border-dashed border-border bg-surface-muted/40 p-3"
              >
                <p className="text-sm font-medium text-foreground">{tool.label}</p>
                <p className="mt-1 text-[11px] text-muted">{tool.reason}</p>
                <Link
                  href={tool.href}
                  className="mt-2 inline-block text-[11px] text-gold hover:underline"
                >
                  Open route →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Platform" };
