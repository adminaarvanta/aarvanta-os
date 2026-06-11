import { Badge } from "@/components/ui/badge";
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
      <Badge className={cn("bg-[#1a1714] text-[#A89878] ring-[#3d3528]", className)}>
        Unscored
      </Badge>
    );
  }

  const tone =
    score >= 80
      ? "bg-emerald-950/60 text-emerald-300 ring-emerald-700/50"
      : score >= 50
        ? "bg-amber-950/60 text-amber-300 ring-amber-700/50"
        : "bg-zinc-800/80 text-zinc-300 ring-zinc-600/50";

  return (
    <Badge className={cn(tone, className)}>
      Score {score}
    </Badge>
  );
}
