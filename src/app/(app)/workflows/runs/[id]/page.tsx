import Link from "next/link";
import { notFound } from "next/navigation";
import { ApproveWorkflowButton } from "@/components/workflow/approve-workflow-button";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { getTenantScope } from "@/lib/tenant/context";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils";

const statusColors = {
  running: "bg-gold/10 text-gold-bright ring-gold/35",
  completed: "bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/30",
  failed: "bg-danger/15 text-danger ring-danger/45",
  awaiting_approval: "bg-navy/60 text-gold-bright ring-gold/30",
} as const;

export default async function WorkflowRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scope = await getTenantScope();
  const run = await getWorkflowRepository().getRun(id, scope);
  if (!run) notFound();

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href={`/workflows/${run.workflowId}`}
          className="text-xs text-gold hover:underline"
        >
          ← {run.workflowName}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">
            Workflow run
          </h2>
          <Badge className={statusColors[run.status]}>{run.status.replace("_", " ")}</Badge>
        </div>
        <p className="text-xs text-muted">
          {formatRelative(run.createdAt)}
          {run.context.contactName ? ` · ${run.context.contactName}` : ""}
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        <ApproveWorkflowButton run={run} />

        {run.error && (
          <div className="rounded-xl border border-danger/45 bg-danger/15 p-4 text-sm text-red-300">
            {run.error}
          </div>
        )}

        <section className="rounded-xl border border-border bg-surface-elevated p-5">
          <h3 className="text-sm font-semibold text-foreground">Context</h3>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {run.context.contactName && (
              <>
                <dt className="text-muted">Contact</dt>
                <dd>{run.context.contactName}</dd>
              </>
            )}
            {run.context.leadScore !== undefined && (
              <>
                <dt className="text-muted">Lead score</dt>
                <dd>{run.context.leadScore}</dd>
              </>
            )}
            {run.context.dealValue !== undefined && (
              <>
                <dt className="text-muted">Deal value</dt>
                <dd>£{run.context.dealValue.toLocaleString()}</dd>
              </>
            )}
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-surface-elevated p-5">
          <h3 className="text-sm font-semibold text-foreground">Step log</h3>
          <ul className="mt-4 space-y-3">
            {run.stepLogs.map((log) => (
              <li
                key={`${log.stepId}-${log.at}`}
                className="rounded-lg border border-border bg-surface-muted p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{log.stepLabel}</p>
                  <Badge className="bg-background text-muted ring-border">
                    {log.stepType}
                  </Badge>
                  <Badge className="bg-background text-muted ring-border">
                    {log.status}
                  </Badge>
                </div>
                {log.output && (
                  <p className="mt-2 text-xs text-muted whitespace-pre-wrap">
                    {log.output}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "Workflow run" };
