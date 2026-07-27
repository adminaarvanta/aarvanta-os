import Link from "next/link";
import { ApprovalActions } from "@/components/workforce/approval-actions";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import { WfHeader, WfPanel } from "@/components/workforce/workforce-shell";
import {
  getWorkforceExecutionsStore,
  getWorkforceGoalsStore,
} from "@/lib/data/workforce-pipeline-store";
import { listPendingApprovals } from "@/lib/workforce/pipeline/approvals";
import { goalDisplayLabel } from "@/lib/workforce/pipeline/goal-engine";
import { getTenantScope } from "@/lib/tenant/context";

export default async function WorkforceApprovalsPage() {
  const scope = await getTenantScope();
  const pending = await listPendingApprovals(scope);
  const [executions, goals] = await Promise.all([
    getWorkforceExecutionsStore().list(scope),
    getWorkforceGoalsStore().list(scope),
  ]);
  const execMap = new Map(executions.map((e) => [e.id, e]));
  const goalMap = new Map(goals.map((g) => [g.id, g]));

  return (
    <>
      <WfHeader
        title="Approvals"
        subtitle={
          pending.length === 0
            ? "You're all caught up"
            : `${pending.length} waiting for you`
        }
      />
      <WorkforceNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-lg space-y-4">
          {pending.length === 0 ? (
            <WfPanel>
              <p
                className="py-8 text-center text-sm"
                style={{ color: "var(--wf-muted)" }}
              >
                No pending approvals.
              </p>
            </WfPanel>
          ) : (
            pending.map((approval) => {
              const execution = execMap.get(approval.executionId);
              const goal = execution
                ? goalMap.get(execution.goalId)
                : undefined;
              return (
                <WfPanel key={approval.id} className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold" style={{ color: "var(--wf-ink)" }}>
                      {goal ? goalDisplayLabel(goal) : "Workforce task"}
                    </h3>
                    {execution && (
                      <Link
                        href={`/workforce/tasks/${execution.id}`}
                        className="shrink-0 text-xs font-semibold"
                        style={{ color: "var(--wf-accent)" }}
                      >
                        Open →
                      </Link>
                    )}
                  </div>
                  <ApprovalActions
                    executionId={approval.executionId}
                    approval={approval}
                  />
                </WfPanel>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

export const metadata = { title: "Workforce Approvals" };
