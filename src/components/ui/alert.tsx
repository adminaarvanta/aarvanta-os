import { cn } from "@/lib/utils";

type AlertTone = "info" | "success" | "warning" | "danger";

const TONE: Record<AlertTone, string> = {
  info: "border-accent-cyan/30 bg-accent-cyan/10 text-foreground",
  success: "border-success/30 bg-success/10 text-foreground",
  warning: "border-gold/40 bg-gold/10 text-foreground",
  danger: "border-danger/40 bg-danger/10 text-foreground",
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-xl border px-4 py-3 text-sm", TONE[tone], className)}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={title ? "mt-1 text-muted" : undefined}>{children}</div> : null}
    </div>
  );
}
