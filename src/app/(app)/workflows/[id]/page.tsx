import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DeleteWorkflowButton,
  WorkflowEnableToggle,
} from "@/components/workflow/workflow-enable-toggle";
import { WorkflowEditor } from "@/components/workflow/workflow-editor";
import { WorkflowNav } from "@/components/workflow/workflow-nav";
import { WorkflowRunList } from "@/components/workflow/workflow-run-list";
import { WorkflowTestRunPanel } from "@/components/workflow/workflow-test-run-panel";
import {
  FlowChip,
  FlowHeader,
  FlowPanel,
} from "@/components/workflow/workflow-shell";
import { getCrmRepository } from "@/lib/data/crm-store";
import { isAutomationBackground } from "@/lib/data/workflow-demo-seed";
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
      <FlowHeader
        title={workflow.name}
        subtitle={
          <div className="space-y-1.5">
            <Link
              href="/automation"
              className="text-xs font-medium hover:underline"
              style={{ color: "var(--flow-accent)" }}
            >
              ← All automations
            </Link>
            {workflow.description ? (
              <p style={{ color: "var(--flow-muted)" }}>{workflow.description}</p>
            ) : null}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <FlowChip tone="cyan">{workflow.trigger.label}</FlowChip>
              <FlowChip tone="muted">{workflow.steps.length} steps</FlowChip>
            </div>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <WorkflowEnableToggle
              workflow={workflow}
              labels={
                isAutomationBackground(workflow.templateId)
                  ? { on: "Automatic", off: "Off" }
                  : { on: "On", off: "Off" }
              }
            />
            <DeleteWorkflowButton workflowId={workflow.id} />
          </div>
        }
      />
      <WorkflowNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
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

          <FlowPanel className="!p-0 overflow-hidden">
            <div
              className="border-b px-5 py-4"
              style={{ borderColor: "var(--flow-line)" }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--flow-ink)" }}
              >
                Run history
              </h3>
            </div>
            <WorkflowRunList runs={runs} />
          </FlowPanel>
        </div>
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
