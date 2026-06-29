import type { LucideIcon } from "lucide-react";
import { PageFrame, PageScroll } from "@/components/layout/page-scroll";
import { EmptyState } from "@/components/ui/os/empty-state";
import { PageHeader } from "@/components/ui/os/page-header";
import { Panel } from "@/components/ui/os/panel";
import { StatTile } from "@/components/ui/os/stat-tile";
import { StatusPill } from "@/components/ui/os/status-pill";

export function ModulePageShell({
  icon: Icon,
  title,
  description,
  actions,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <PageFrame>
      <PageHeader
        icon={Icon}
        title={title}
        description={description}
        actions={actions}
      />
      <PageScroll className="p-4 sm:p-6">{children}</PageScroll>
    </PageFrame>
  );
}

export function StatGrid({
  items,
}: {
  items: { label: string; value: string | number; sub?: string; href?: string }[];
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <StatTile
          key={item.label}
          label={item.label}
          value={item.value}
          sub={item.sub}
          href={item.href}
        />
      ))}
    </dl>
  );
}

export function CardList({
  items,
}: {
  items: { id: string; title: string; body?: string; meta?: string; badge?: string }[];
}) {
  if (!items.length) {
    return (
      <EmptyState
        title="Nothing here yet"
        description="Records will appear as your team creates and updates data."
      />
    );
  }

  return (
    <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface-elevated">
      {items.map((item) => (
        <li
          key={item.id}
          className="group px-4 py-3.5 transition-colors hover:bg-surface-hover"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground group-hover:text-gold-bright">
              {item.title}
            </p>
            {item.badge && <StatusPill variant="gold">{item.badge}</StatusPill>}
          </div>
          {item.body && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted line-clamp-2">{item.body}</p>
          )}
          {item.meta && (
            <p className="mt-2 text-[11px] tabular-nums text-dim">{item.meta}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

export { Panel, StatusPill };
