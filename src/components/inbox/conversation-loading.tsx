import { Skeleton } from "@/components/ui/skeleton";

function ListSkeleton() {
  return (
    <ul className="divide-y divide-[#3d3528]/80" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="px-4 py-3.5 space-y-2">
          <div className="flex justify-between gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="hidden border-b border-[#3d3528] px-6 py-4 lg:block">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
        <div className="flex-1 space-y-4 p-4 sm:p-6">
          <Skeleton className="h-3 w-36" />
          <div className="space-y-3">
            <Skeleton className="ml-0 mr-16 h-16 rounded-2xl" />
            <Skeleton className="ml-16 mr-0 h-14 rounded-2xl" />
            <Skeleton className="ml-0 mr-20 h-12 rounded-2xl" />
            <Skeleton className="ml-12 mr-0 h-20 rounded-2xl" />
          </div>
        </div>
        <div className="border-t border-[#3d3528] p-4 space-y-2">
          <Skeleton className="h-9 w-full sm:w-40" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-9 w-full sm:w-24" />
        </div>
      </section>
      <aside className="w-full space-y-6 border-t border-[#3d3528] p-4 lg:w-80 lg:border-t-0 lg:border-l">
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-8 w-full" />
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
      </aside>
    </div>
  );
}

export function ConversationPageLoading({
  showList = true,
}: {
  showList?: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading conversation…</span>
      <header className="shrink-0 flex items-center gap-3 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6">
        <Skeleton className="h-8 w-8 rounded-lg lg:hidden" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-40 sm:h-6 sm:w-52" />
          <Skeleton className="h-3 w-56 lg:hidden" />
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {showList && (
          <div className="hidden w-80 shrink-0 overflow-y-auto border-r border-[#3d3528] bg-[#101010] lg:block">
            <ListSkeleton />
          </div>
        )}
        <DetailSkeleton />
      </div>
    </div>
  );
}

export function PageHeaderLoading({ lines = 2 }: { lines?: number }) {
  return (
    <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
      <Skeleton className="h-6 w-40 sm:h-7 sm:w-48" />
      {lines > 1 && <Skeleton className="mt-2 h-3 w-full max-w-md sm:h-4" />}
    </header>
  );
}

export function CrmOverviewLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading CRM…</span>
      <PageHeaderLoading />
      <div className="shrink-0 border-b border-[#3d3528] bg-[#0a0a0a] px-3 sm:px-6">
        <div className="flex gap-4 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

export function CrmListLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <PageHeaderLoading />
      <div className="shrink-0 border-b border-[#3d3528] bg-[#0a0a0a] px-3 sm:px-6">
        <div className="flex gap-4 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
