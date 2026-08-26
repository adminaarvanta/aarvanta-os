import { format } from "date-fns";
import { Calendar, Phone, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_META = {
  call: {
    icon: Phone,
    label: "Call",
    wash: "bg-violet-500/15 text-violet-700 dark:text-violet-200",
  },
  meeting: {
    icon: Calendar,
    label: "Meeting",
    wash: "bg-sky-500/15 text-sky-700 dark:text-sky-200",
  },
  note: {
    icon: StickyNote,
    label: "Note",
    wash: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  },
} as const;

export function CrmTimeline({
  items,
  empty = "No activities logged.",
}: {
  items: Array<{
    id: string;
    type: "call" | "meeting" | "note" | string;
    title: string;
    description?: string;
    occurredAt: string;
    authorName?: string;
  }>;
  empty?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => {
        const meta =
          item.type in TYPE_META
            ? TYPE_META[item.type as keyof typeof TYPE_META]
            : TYPE_META.note;
        const Icon = meta.icon;
        return (
          <li key={item.id} className="flex gap-3 border-b border-border-subtle pb-3 last:border-0 last:pb-0">
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                meta.wash
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-sm text-muted">{item.description}</p>
              ) : null}
              <p className="mt-1 text-[11px] text-muted">
                {meta.label} · {format(new Date(item.occurredAt), "dd MMM yyyy HH:mm")}
                {item.authorName ? ` · ${item.authorName}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
