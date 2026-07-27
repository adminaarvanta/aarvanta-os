import Link from "next/link";
import { StartTaskPanel } from "@/components/workforce/start-task-panel";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import { WfHeader } from "@/components/workforce/workforce-shell";
import {
  getWorkforceExecutionsStore,
  getWorkforceGoalsStore,
} from "@/lib/data/workforce-pipeline-store";
import { goalDisplayLabel } from "@/lib/workforce/pipeline/goal-engine";
import { agentLabel } from "@/lib/workforce/pipeline/labels";
import { getTenantScope } from "@/lib/tenant/context";
import type { WorkforceExecutionStatus } from "@/types/workforce";

function statusStyle(status: WorkforceExecutionStatus) {
  if (status === "completed")
    return { bg: "var(--wf-ok-soft)", color: "var(--wf-ok)" };
  if (status === "failed")
    return { bg: "var(--wf-danger-soft)", color: "var(--wf-danger)" };
  if (status === "awaiting_approval")
    return { bg: "var(--wf-wait-soft)", color: "#B45309" };
  return { bg: "var(--wf-accent-soft)", color: "var(--wf-accent)" };
}

type PageProps = {
  searchParams: Promise<{
    start?: string;
    contactId?: string;
    dealId?: string;
    conversationId?: string;
  }>;
};

/** One job: either start a goal OR browse the task list — never both. */
export default async function WorkforceTasksPage({ searchParams }: PageProps) {
  const scope = await getTenantScope();
  const params = await searchParams;
  const starting = params.start === "1";

  if (starting) {
    return (
      <>
        <WfHeader
          title="New task"
          subtitle="What do you want to achieve?"
          actions={
            <Link
              href="/workforce/tasks"
              className="text-sm font-semibold"
              style={{ color: "var(--wf-accent)" }}
            >
              Cancel
            </Link>
          }
        />
        <WorkforceNav />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
          <div className="mx-auto max-w-2xl">
            <StartTaskPanel
              defaultOpen
              contactId={params.contactId}
              dealId={params.dealId}
              conversationId={params.conversationId}
            />
          </div>
        </div>
      </>
    );
  }

  const [executions, goals] = await Promise.all([
    getWorkforceExecutionsStore().list(scope),
    getWorkforceGoalsStore().list(scope),
  ]);
  const goalMap = new Map(goals.map((g) => [g.id, g]));
  executions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      <WfHeader
        title="Tasks"
        subtitle={`${executions.length} total`}
        actions={
          <Link
            href="/workforce/tasks?start=1"
            className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--wf-accent)" }}
          >
            + Start task
          </Link>
        }
      />
      <WorkforceNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <div
          className="mx-auto max-w-5xl overflow-hidden rounded-xl border bg-white shadow-[0_1px_3px_rgba(14,21,37,0.04)]"
          style={{ borderColor: "var(--wf-line)" }}
        >
          {executions.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm" style={{ color: "var(--wf-muted)" }}>
                No tasks yet.
              </p>
              <Link
                href="/workforce/tasks?start=1"
                className="mt-4 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                style={{ background: "var(--wf-accent)" }}
              >
                Start your first task
              </Link>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--wf-line)" }}>
              {executions.map((execution) => {
                const goal = goalMap.get(execution.goalId);
                const tone = statusStyle(execution.status);
                return (
                  <li key={execution.id}>
                    <Link
                      href={`/workforce/tasks/${execution.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-[#F8F9FC]"
                    >
                      <div className="min-w-0">
                        <p
                          className="truncate font-semibold"
                          style={{ color: "var(--wf-ink)" }}
                        >
                          {goal ? goalDisplayLabel(goal) : "Workforce task"}
                        </p>
                        <p
                          className="mt-0.5 truncate text-xs"
                          style={{ color: "var(--wf-muted)" }}
                        >
                          {execution.assignedAgents.map(agentLabel).join(", ")}
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase"
                        style={{ background: tone.bg, color: tone.color }}
                      >
                        {execution.status.replace(/_/g, " ")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

export const metadata = { title: "Workforce Tasks" };
