import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskExecutionView } from "@/components/workforce/task-execution-view";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import { WfHeader } from "@/components/workforce/workforce-shell";
import {
  getWorkforceApprovalsStore,
  getWorkforceExecutionsStore,
  getWorkforceGoalsStore,
  getWorkforceReportsStore,
} from "@/lib/data/workforce-pipeline-store";
import { goalDisplayLabel } from "@/lib/workforce/pipeline/goal-engine";
import { getTenantScope } from "@/lib/tenant/context";

type PageProps = { params: Promise<{ id: string }> };

export default async function WorkforceTaskDetailPage({ params }: PageProps) {
  const scope = await getTenantScope();
  const { id } = await params;
  const execution = await getWorkforceExecutionsStore().get(id, scope);
  if (!execution) notFound();

  const [goal, report, approvals] = await Promise.all([
    getWorkforceGoalsStore().get(execution.goalId, scope),
    execution.reportId
      ? getWorkforceReportsStore().get(execution.reportId, scope)
      : Promise.resolve(null),
    getWorkforceApprovalsStore()
      .list(scope)
      .then((all) => all.filter((a) => a.executionId === execution.id)),
  ]);

  const pendingApproval = approvals.find((a) => a.status === "pending") ?? null;
  const goalLabel = goal ? goalDisplayLabel(goal) : "Workforce task";

  return (
    <>
      <WfHeader
        title={goalLabel}
        subtitle={
          <span className="capitalize">
            {execution.status.replace(/_/g, " ")}
            {goal?.priority ? ` · ${goal.priority} priority` : ""}
          </span>
        }
        actions={
          <Link
            href="/workforce/tasks"
            className="text-sm font-semibold"
            style={{ color: "var(--wf-accent)" }}
          >
            ← All tasks
          </Link>
        }
      />
      <WorkforceNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <TaskExecutionView
            execution={execution}
            goalLabel={goalLabel}
            report={report}
            approvals={approvals}
            pendingApproval={pendingApproval}
          />
        </div>
      </div>
    </>
  );
}

export const metadata = { title: "Task Detail" };
