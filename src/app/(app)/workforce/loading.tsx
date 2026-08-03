import { WorkforceShell } from "@/components/workforce/workforce-shell";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className ?? ""}`}
      style={{ background: "#E8EAF0" }}
    />
  );
}

/** Matches the simplified purple/white workforce layout. */
export default function WorkforceLoading() {
  return (
    <WorkforceShell>
      <div className="px-5 py-5 sm:px-8" style={{ background: "var(--wf-bg)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="space-y-2">
            <Bone className="h-7 w-40" />
            <Bone className="h-4 w-28" />
          </div>
          <Bone className="h-9 w-28 rounded-full" />
        </div>
      </div>

      <div className="px-5 sm:px-8" style={{ background: "var(--wf-bg)" }}>
        <div
          className="mx-auto flex max-w-5xl gap-4 border-b pb-0"
          style={{ borderColor: "var(--wf-line)" }}
        >
          <Bone className="mb-2.5 h-4 w-20" />
          <Bone className="mb-2.5 h-4 w-14" />
          <Bone className="mb-2.5 h-4 w-20" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-5 py-6 sm:px-8">
        <div
          className="mx-auto max-w-5xl overflow-hidden rounded-xl border bg-white"
          style={{ borderColor: "var(--wf-line)" }}
          aria-busy="true"
          aria-live="polite"
        >
          <span className="sr-only">Loading AI Team…</span>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0"
              style={{ borderColor: "var(--wf-line)" }}
            >
              <Bone className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Bone className="h-4 w-36" />
                  <Bone className="h-5 w-16 rounded-full" />
                </div>
                <Bone className="h-3 w-2/3 max-w-md" />
              </div>
              <Bone className="h-11 w-11 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </WorkforceShell>
  );
}
