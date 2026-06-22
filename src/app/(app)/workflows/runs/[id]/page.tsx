import Link from "next/link";
import { notFound } from "next/navigation";
import { ApproveWorkflowButton } from "@/components/workflow/approve-workflow-button";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { getTenantScope } from "@/lib/tenant/context";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils";

const statusColors = {
  running: "bg-amber-950/60 text-amber-300 ring-amber-700/50",
  completed: "bg-emerald-950/60 text-emerald-300 ring-emerald-700/50",
  failed: "bg-red-950/60 text-red-300 ring-red-700/50",
  awaiting_approval: "bg-violet-950/60 text-violet-300 ring-violet-700/50",
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
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href={`/workflows/${run.workflowId}`}
          className="text-xs text-[#D4AF37] hover:underline"
        >
          ← {run.workflowName}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-[#F5E6C8] sm:text-xl">
            Workflow run
          </h2>
          <Badge className={statusColors[run.status]}>{run.status.replace("_", " ")}</Badge>
        </div>
        <p className="text-xs text-[#A89878]">
          {formatRelative(run.createdAt)}
          {run.context.contactName ? ` · ${run.context.contactName}` : ""}
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        <ApproveWorkflowButton run={run} />

        {run.error && (
          <div className="rounded-xl border border-red-800/50 bg-red-950/30 p-4 text-sm text-red-300">
            {run.error}
          </div>
        )}

        <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
          <h3 className="text-sm font-semibold text-[#F5E6C8]">Context</h3>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {run.context.contactName && (
              <>
                <dt className="text-[#A89878]">Contact</dt>
                <dd>{run.context.contactName}</dd>
              </>
            )}
            {run.context.leadScore !== undefined && (
              <>
                <dt className="text-[#A89878]">Lead score</dt>
                <dd>{run.context.leadScore}</dd>
              </>
            )}
            {run.context.dealValue !== undefined && (
              <>
                <dt className="text-[#A89878]">Deal value</dt>
                <dd>£{run.context.dealValue.toLocaleString()}</dd>
              </>
            )}
          </dl>
        </section>

        <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
          <h3 className="text-sm font-semibold text-[#F5E6C8]">Step log</h3>
          <ul className="mt-4 space-y-3">
            {run.stepLogs.map((log) => (
              <li
                key={`${log.stepId}-${log.at}`}
                className="rounded-lg border border-[#3d3528] bg-[#141414] p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-[#F5E6C8]">{log.stepLabel}</p>
                  <Badge className="bg-[#0a0a0a] text-[#A89878] ring-[#3d3528]">
                    {log.stepType}
                  </Badge>
                  <Badge className="bg-[#0a0a0a] text-[#A89878] ring-[#3d3528]">
                    {log.status}
                  </Badge>
                </div>
                {log.output && (
                  <p className="mt-2 text-xs text-[#A89878] whitespace-pre-wrap">
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
