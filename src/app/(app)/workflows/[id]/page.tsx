import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DeleteWorkflowButton,
  WorkflowEnableToggle,
} from "@/components/workflow/workflow-enable-toggle";
import { WorkflowEditor } from "@/components/workflow/workflow-editor";
import { WorkflowRunList } from "@/components/workflow/workflow-run-list";
import { WorkflowTestRunPanel } from "@/components/workflow/workflow-test-run-panel";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scope = await getTenantScope();
  const repo = getWorkflowRepository();
  const crm = getCrmRepository();

  const workflow = await repo.getWorkflow(id, scope);
  if (!workflow) notFound();

  const [runs, contacts, deals] = await Promise.all([
    repo.listRuns(scope, id),
    crm.listContacts(scope),
    crm.listDeals(scope),
  ]);

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/workflows" className="text-xs text-gold hover:underline">
          ← Workflows
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              {workflow.name}
            </h2>
            {workflow.description && (
              <p className="text-xs text-muted sm:text-sm">{workflow.description}</p>
            )}
            <p className="mt-1 text-[10px] text-muted">
              Trigger: {workflow.trigger.label} · {workflow.steps.length} steps
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WorkflowEnableToggle workflow={workflow} />
            <DeleteWorkflowButton workflowId={workflow.id} />
          </div>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-8 sm:p-6">
        <WorkflowEditor workflow={workflow} />

        <WorkflowTestRunPanel
          workflowId={workflow.id}
          contacts={contacts.map((c) => ({
            id: c.id,
            name: contactDisplayName(c),
            leadScore: c.leadScore,
          }))}
          deals={deals.map((d) => ({
            id: d.id,
            title: d.title,
            value: d.value,
            contactId: d.contactId,
          }))}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Run history</h3>
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
