import { FlowHeader } from "@/components/workflow/workflow-shell";
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
    <WorkflowHub
      workflows={workflows}
      runs={runs}
      templates={WORKFLOW_TEMPLATES}
      header={
        <FlowHeader
          title="Workflows"
          subtitle="BDM playbooks — outreach, follow-ups, meetings, and handoffs"
        />
      }
    />
  );
}

export const metadata = { title: "Workflows" };
