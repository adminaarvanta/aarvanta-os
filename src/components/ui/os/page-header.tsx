import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  meta,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "shrink-0 border-b border-border bg-[#040608] px-4 py-3 sm:px-6 sm:py-4",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {Icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/20">
                <Icon className="h-4 w-4 text-gold" />
              </span>
            )}
            <span className="truncate">{title}</span>
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted sm:text-sm">
              {description}
            </p>
          )}
          {meta && <div className="mt-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
