import { cn } from "@/lib/utils";
import { statusTone } from "@/lib/ui/status-tone";

export function Badge({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusTone.neutral,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
