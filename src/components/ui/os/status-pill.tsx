import { cn } from "@/lib/utils";
import { statusTone } from "@/lib/ui/status-tone";

const VARIANTS = {
  default: statusTone.neutral,
  gold: statusTone.gold,
  success: statusTone.success,
  warning: statusTone.warning,
  danger: statusTone.danger,
  info: statusTone.info,
} as const;

export function StatusPill({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
