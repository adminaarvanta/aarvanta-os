import { Badge } from "@/components/ui/badge";
import { SENTIMENT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Sentiment } from "@/types/communication";

const styles: Record<Sentiment, string> = {
  positive: "bg-emerald-950/60 text-emerald-300 ring-emerald-700/50",
  neutral: "bg-zinc-800/80 text-zinc-300 ring-zinc-600/50",
  frustrated: "bg-amber-950/60 text-amber-300 ring-amber-700/50",
  urgent: "bg-red-950/60 text-red-300 ring-red-700/50",
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <Badge className={cn(styles[sentiment])}>
      {SENTIMENT_LABELS[sentiment]}
    </Badge>
  );
}
