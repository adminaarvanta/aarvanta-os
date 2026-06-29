import Link from "next/link";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  description,
  action,
  actionHref,
  className,
}: {
  title: string;
  description?: string;
  action?: string;
  actionHref?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex flex-wrap items-end justify-between gap-2", className)}>
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        )}
      </div>
      {action && actionHref && (
        <Link
          href={actionHref}
          className="text-xs font-medium text-gold transition-colors hover:text-gold-bright"
        >
          {action} →
        </Link>
      )}
    </div>
  );
}
