import type { LucideIcon } from "lucide-react";
import { PageFrame, PageScroll } from "@/components/layout/page-scroll";

export function ModulePageShell({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <PageFrame>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#F5E6C8] sm:text-xl">
          <Icon className="h-5 w-5 text-[#D4AF37]" />
          {title}
        </h2>
        <p className="text-xs text-[#A89878] sm:text-sm">{description}</p>
      </header>
      <PageScroll className="p-4 sm:p-6">{children}</PageScroll>
    </PageFrame>
  );
}

export function StatGrid({
  items,
}: {
  items: { label: string; value: string | number; sub?: string }[];
}) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-[#3d3528] bg-[#101010] p-4"
        >
          <dt className="text-[10px] uppercase tracking-wide text-[#A89878]">
            {item.label}
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-[#F5E6C8]">
            {item.value}
          </dd>
          {item.sub && (
            <dd className="mt-0.5 text-xs text-[#A89878]">{item.sub}</dd>
          )}
        </div>
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
    return <p className="text-sm text-[#A89878]">No items yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border border-[#3d3528] bg-[#101010] p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-medium text-[#F5E6C8]">{item.title}</p>
            {item.badge && (
              <span className="rounded-full bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] text-[#F9E076] ring-1 ring-[#D4AF37]/30">
                {item.badge}
              </span>
            )}
          </div>
          {item.body && (
            <p className="mt-2 text-sm text-[#A89878] line-clamp-3">{item.body}</p>
          )}
          {item.meta && (
            <p className="mt-2 text-[10px] text-[#A89878]/70">{item.meta}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
