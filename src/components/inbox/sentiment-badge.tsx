import { Badge } from "@/components/ui/badge";
import { statusTone } from "@/lib/ui/status-tone";
import { SENTIMENT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Sentiment } from "@/types/communication";

const styles: Record<Sentiment, string> = {
  positive: statusTone.success,
  neutral: statusTone.neutral,
  frustrated: statusTone.warning,
  urgent: statusTone.danger,
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <Badge className={cn(styles[sentiment])}>
      {SENTIMENT_LABELS[sentiment]}
    </Badge>
  );
}
