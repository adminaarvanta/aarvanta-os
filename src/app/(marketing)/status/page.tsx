import type { Metadata } from "next";
import { getAppMode } from "@/lib/config/app-mode";

export const metadata: Metadata = { title: "Status" };

export default function StatusPage() {
  const mode = getAppMode();
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold">Status</h1>
      <p className="mt-4 text-sm text-muted">
        This is an application health summary, not a third-party uptime SLA page.
      </p>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="rounded-xl border border-border px-4 py-3">
          <dt className="font-medium">App mode</dt>
          <dd className="text-muted">{mode}</dd>
        </div>
        <div className="rounded-xl border border-border px-4 py-3">
          <dt className="font-medium">Live check</dt>
          <dd className="text-muted">
            Operators should use <code>/api/health</code> for channel and datastore status.
          </dd>
        </div>
      </dl>
    </article>
  );
}
