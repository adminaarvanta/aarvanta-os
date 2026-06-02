import { Badge } from "@/components/ui/badge";
import { SENTIMENT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Sentiment } from "@/types/communication";

const styles: Record<Sentiment, string> = {
  positive: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  frustrated: "bg-amber-50 text-amber-900 ring-amber-200",
  urgent: "bg-red-50 text-red-800 ring-red-200",
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <Badge className={cn(styles[sentiment])}>
      {SENTIMENT_LABELS[sentiment]}
    </Badge>
  );
}
