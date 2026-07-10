import { Badge } from "@/components/ui/badge";
import { statusTone } from "@/lib/ui/status-tone";
import { cn } from "@/lib/utils";

export function LeadScoreBadge({
  score,
  className,
}: {
  score?: number;
  className?: string;
}) {
  if (score == null) {
    return (
      <Badge className={cn(statusTone.neutral, className)}>
        Unscored
      </Badge>
    );
  }

  const tone =
    score >= 80
      ? statusTone.success
      : score >= 50
        ? statusTone.warning
        : statusTone.neutral;

  return (
    <Badge className={cn(tone, className)}>
      Score {score}
    </Badge>
  );
}
