import Link from "next/link";
import { CheckCircle2, Clock, ListTodo, Sparkles } from "lucide-react";
import { StartTaskPanel } from "@/components/workforce/start-task-panel";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import {
  getWorkforceExecutionsStore,
  getWorkforceGoalsStore,
} from "@/lib/data/workforce-pipeline-store";
import { goalDisplayLabel } from "@/lib/workforce/pipeline/goal-engine";
import { agentLabel } from "@/lib/workforce/pipeline/labels";
import { getTenantScope } from "@/lib/tenant/context";
import type { WorkforceExecutionStatus } from "@/types/workforce";
import { cn } from "@/lib/utils";

function statusLabel(status: WorkforceExecutionStatus) {
  const map: Record<WorkforceExecutionStatus, string> = {
    created: "Created",
    planning: "Planning",
    collecting_context: "Collecting context",
    executing: "In progress",
    awaiting_approval: "Needs approval",
    completed: "Completed",
    failed: "Failed",
  };
  return map[status];
}

function statusTone(status: WorkforceExecutionStatus) {
  if (status === "completed") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (status === "failed") return "bg-red-500/15 text-red-700 dark:text-red-400";
  if (status === "awaiting_approval") return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  if (status === "executing") return "bg-sky-500/15 text-sky-700 dark:text-sky-400";
  return "bg-surface-muted text-muted";
}

type PageProps = {
  searchParams: Promise<{
    start?: string;
    contactId?: string;
    dealId?: string;
    conversationId?: string;
  }>;
};

export default async function WorkforceTasksPage({ searchParams }: PageProps) {
  const scope = await getTenantScope();
  const params = await searchParams;
  const [executions, goals] = await Promise.all([
    getWorkforceExecutionsStore().list(scope),
    getWorkforceGoalsStore().list(scope),
  ]);
  const goalMap = new Map(goals.map((g) => [g.id, g]));
  executions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const open = executions.filter(
    (e) => e.status !== "completed" && e.status !== "failed"
  ).length;
  const awaiting = executions.filter((e) => e.status === "awaiting_approval").length;
  const done = executions.filter((e) => e.status === "completed").length;

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground sm:text-xl">
              <ListTodo className="h-5 w-5 text-gold" />
              Workforce Tasks
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              Goal-driven executions with timeline, approvals, and reports.
            </p>
          </div>
        </div>
      </header>
      <WorkforceNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        <StartTaskPanel
          defaultOpen={params.start === "1"}
          contactId={params.contactId}
          dealId={params.dealId}
          conversationId={params.conversationId}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Open", value: open, icon: Clock },
            { label: "Needs approval", value: awaiting, icon: Sparkles },
            { label: "Completed", value: done, icon: CheckCircle2 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-surface-elevated p-4"
            >
              <div className="flex items-center gap-2 text-xs text-muted">
                <stat.icon className="h-3.5 w-3.5" />
                {stat.label}
              </div>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">All tasks</h3>
          {executions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
              No workforce tasks yet. Start a goal above.
            </p>
          ) : (
            <ul className="space-y-2">
              {executions.map((execution) => {
                const goal = goalMap.get(execution.goalId);
                return (
                  <li key={execution.id}>
                    <Link
                      href={`/workforce/tasks/${execution.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated p-4 transition-colors hover:border-gold/40"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {goal ? goalDisplayLabel(goal) : "Workforce task"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {execution.assignedAgents.map(agentLabel).join(", ")} ·{" "}
                          {new Date(execution.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-md px-2 py-1 text-[10px] font-semibold uppercase",
                          statusTone(execution.status)
                        )}
                      >
                        {statusLabel(execution.status)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "Workforce Tasks" };
