import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderLoading } from "@/components/inbox/conversation-loading";

export default function InboxLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading inbox…</span>
      <PageHeaderLoading />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 w-full shrink-0 overflow-y-auto overscroll-contain border-r border-border bg-surface-elevated md:w-80">
          <ul className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="px-4 py-3.5 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </li>
            ))}
          </ul>
        </div>
        <section className="hidden flex-1 items-center justify-center bg-background md:flex">
          <Skeleton className="h-4 w-48" />
        </section>
      </div>
    </div>
  );
}
