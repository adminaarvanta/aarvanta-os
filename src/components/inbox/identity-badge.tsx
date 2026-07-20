import { Badge } from "@/components/ui/badge";
import { Building2, User, HelpCircle } from "lucide-react";
import type { ConversationIdentity } from "@/types/communication";
import { cn } from "@/lib/utils";

export function IdentityBadge({
  identity,
  compact = false,
  className,
}: {
  identity?: ConversationIdentity;
  compact?: boolean;
  className?: string;
}) {
  const type = identity?.type ?? "unknown";
  const conf = identity?.confidence ?? 0;

  const label =
    type === "company" ? "Company" : type === "individual" ? "Individual" : "Unknown";
  const Icon =
    type === "company" ? Building2 : type === "individual" ? User : HelpCircle;

  const color =
    type === "company"
      ? "bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/25"
      : type === "individual"
        ? "bg-primary-soft text-primary-bright ring-primary/25"
        : "bg-surface-muted text-muted ring-border";

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1 text-[10px]",
        color,
        className
      )}
      title={
        identity
          ? `${label} · ${Math.round(conf * 100)}% confidence · ${identity.signals.length} signal(s)`
          : "Identity not classified yet"
      }
    >
      <Icon className="h-3 w-3" aria-hidden />
      {compact ? label : `${label}${conf > 0 ? ` ${Math.round(conf * 100)}%` : ""}`}
    </Badge>
  );
}
