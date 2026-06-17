import { Workflow } from "lucide-react";
import { WorkflowList } from "@/components/workflow/workflow-list";
import { WorkflowRunList } from "@/components/workflow/workflow-run-list";
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
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#F5E6C8] sm:text-xl">
          <Workflow className="h-5 w-5 text-[#D4AF37]" />
          Workflows
        </h2>
        <p className="text-xs text-[#A89878] sm:text-sm">
          Workflow OS — trigger → condition → agent → approval → action.
        </p>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-8 sm:p-6">
        <section>
          <h3 className="mb-4 text-sm font-semibold text-[#F5E6C8]">
            Active workflows ({workflows.length})
          </h3>
          <WorkflowList workflows={workflows} />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Recent runs</h3>
          <WorkflowRunList runs={runs.slice(0, 10)} />
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "Workflows" };
