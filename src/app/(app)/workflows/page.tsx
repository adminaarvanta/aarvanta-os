import { Workflow } from "lucide-react";
import { WorkflowList } from "@/components/workflow/workflow-list";
import { WorkflowRunList } from "@/components/workflow/workflow-run-list";
import { WorkflowBuilder } from "@/components/workflow/workflow-builder";
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
      <header className="shrink-0 border-b border-[#243656] bg-[#0D1524] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#FFFFFF] sm:text-xl">
          <Workflow className="h-5 w-5 text-[#B8965D]" />
          Workflows
        </h2>
        <p className="text-xs text-[#9AABC4] sm:text-sm">
          Workflow OS — trigger → condition → agent → approval → action.
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-8 sm:p-6">
        <WorkflowBuilder />

        <section>
          <h3 className="mb-4 text-sm font-semibold text-[#FFFFFF]">
            Active workflows ({workflows.length})
          </h3>
          <WorkflowList workflows={workflows} />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Recent runs</h3>
          <WorkflowRunList runs={runs.slice(0, 10)} />
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "Workflows" };
