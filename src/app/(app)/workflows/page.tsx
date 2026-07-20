import { Workflow } from "lucide-react";
import { WorkflowHub } from "@/components/workflow/workflow-hub";
import { WORKFLOW_TEMPLATES } from "@/lib/data/workflow-demo-seed";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function WorkflowsPage() {
  const scope = await getTenantScope();
  const repo = getWorkflowRepository();
  const [workflows, runs] = await Promise.all([
    repo.listWorkflows(scope),
    repo.listRuns(scope),
  ]);

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground sm:text-xl">
          <Workflow className="h-5 w-5 text-gold" />
          Workflows
        </h2>
        <p className="text-xs text-muted sm:text-sm">
          Zapier-style automations — templates, editable steps, CRM triggers, and test runs.
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <WorkflowHub
          workflows={workflows}
          runs={runs}
          templates={WORKFLOW_TEMPLATES}
        />
      </div>
    </>
  );
}

export const metadata = { title: "Workflows" };
