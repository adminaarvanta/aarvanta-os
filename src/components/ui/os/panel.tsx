import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  padding = "md",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface-elevated",
        padding === "sm" && "p-3",
        padding === "md" && "p-4 sm:p-5",
        padding === "lg" && "p-5 sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
