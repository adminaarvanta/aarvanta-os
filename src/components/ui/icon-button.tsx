import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/lib/ui/focus";

export function IconButton({
  className,
  label,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50",
        FOCUS_RING,
        className
      )}
      {...props}
    />
  );
}
