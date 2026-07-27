import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { ApprovalActions } from "@/components/workforce/approval-actions";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
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
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground sm:text-xl">
            <ShieldAlert className="h-5 w-5 text-gold" />
            Approvals
          </h2>
          <p className="text-xs text-muted sm:text-sm">
            Human checkpoints when AI reaches a policy limit.
          </p>
        </div>
      </header>
      <WorkforceNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 sm:p-6">
        {pending.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No pending approvals.
          </p>
        ) : (
          pending.map((approval) => {
            const execution = execMap.get(approval.executionId);
            const goal = execution
              ? goalMap.get(execution.goalId)
              : undefined;
            return (
              <article
                key={approval.id}
                className="rounded-xl border border-border bg-surface-elevated p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {goal ? goalDisplayLabel(goal) : "Workforce task"}
                    </h3>
                    <p className="text-sm text-muted">{approval.reason}</p>
                  </div>
                  {execution && (
                    <Link
                      href={`/workforce/tasks/${execution.id}`}
                      className="text-xs font-medium text-gold hover:text-gold-bright"
                    >
                      Open task →
                    </Link>
                  )}
                </div>
                <ApprovalActions
                  executionId={approval.executionId}
                  approval={approval}
                />
              </article>
            );
          })
        )}
      </div>
    </>
  );
}

export const metadata = { title: "Workforce Approvals" };
