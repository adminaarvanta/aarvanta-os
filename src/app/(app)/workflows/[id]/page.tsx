import Link from "next/link";
import { notFound } from "next/navigation";
import { RunWorkflowButton } from "@/components/workflow/run-workflow-button";
import { WorkflowFlowDiagram } from "@/components/workflow/workflow-flow-diagram";
import { WorkflowRunList } from "@/components/workflow/workflow-run-list";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scope = await getTenantScope();
  const repo = getWorkflowRepository();

  const workflow = await repo.getWorkflow(id, scope);
  if (!workflow) notFound();

  const runs = await repo.listRuns(scope, id);

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/workflows" className="text-xs text-[#D4AF37] hover:underline">
          ← Workflows
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#F5E6C8] sm:text-xl">
              {workflow.name}
            </h2>
            {workflow.description && (
              <p className="text-xs text-[#A89878] sm:text-sm">{workflow.description}</p>
            )}
          </div>
          <RunWorkflowButton workflowId={workflow.id} />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-8 sm:p-6">
        <WorkflowFlowDiagram workflow={workflow} />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Run history</h3>
          <WorkflowRunList runs={runs} />
        </section>
      </div>
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scope = await getTenantScope();
  const workflow = await getWorkflowRepository().getWorkflow(id, scope);
  return { title: workflow?.name ?? "Workflow" };
}
