import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Phone,
} from "lucide-react";
import { ApprovalActions } from "@/components/workforce/approval-actions";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import {
  getWorkforceApprovalsStore,
  getWorkforceExecutionsStore,
  getWorkforceGoalsStore,
  getWorkforceReportsStore,
} from "@/lib/data/workforce-pipeline-store";
import { goalDisplayLabel } from "@/lib/workforce/pipeline/goal-engine";
import { agentLabel } from "@/lib/workforce/pipeline/labels";
import { getTenantScope } from "@/lib/tenant/context";
import { cn } from "@/lib/utils";

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

  const pendingApproval = approvals.find((a) => a.status === "pending");
  const completed = execution.status === "completed";

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted">
              <Link href="/workforce/tasks" className="hover:text-gold">
                Tasks
              </Link>{" "}
              / {execution.id.slice(0, 12)}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
              {goal ? goalDisplayLabel(goal) : "Workforce task"}
            </h2>
            <p className="text-xs text-muted capitalize">
              {execution.status.replace(/_/g, " ")}
              {goal?.priority ? ` · ${goal.priority} priority` : ""}
            </p>
          </div>
        </div>
      </header>
      <WorkforceNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        {pendingApproval && (
          <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-foreground">Decision required</h3>
            </div>
            <p className="text-sm text-muted">{pendingApproval.reason}</p>
            <ApprovalActions
              executionId={execution.id}
              approval={pendingApproval}
            />
          </section>
        )}

        {completed && report && (
          <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Task completed</h3>
            </div>
            <p className="text-sm text-muted">{report.outcome}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-surface-elevated p-3 text-center">
                <Phone className="mx-auto h-4 w-4 text-gold" />
                <p className="mt-1 text-lg font-semibold">{report.callsMade}</p>
                <p className="text-[10px] uppercase text-muted">Calls</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-elevated p-3 text-center">
                <MessageSquare className="mx-auto h-4 w-4 text-gold" />
                <p className="mt-1 text-lg font-semibold">{report.messagesSent}</p>
                <p className="text-[10px] uppercase text-muted">Messages</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-elevated p-3 text-center">
                <ClipboardList className="mx-auto h-4 w-4 text-gold" />
                <p className="mt-1 text-lg font-semibold">
                  {report.documentsGenerated}
                </p>
                <p className="text-[10px] uppercase text-muted">Documents</p>
              </div>
            </div>
            {report.suggestions[0] && (
              <p className="text-sm text-foreground">
                <span className="text-muted">Next step: </span>
                {report.suggestions[0]}
              </p>
            )}
          </section>
        )}

        <section className="rounded-xl border border-border bg-surface-elevated p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Execution timeline
          </h3>
          <ol className="relative space-y-4 border-l border-border pl-5">
            {execution.timeline.map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-gold ring-4 ring-surface-elevated" />
                <p className="text-xs text-muted">
                  {new Date(event.at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {event.actorLabel}
                </p>
                <p className="text-sm text-foreground">{event.label}</p>
              </li>
            ))}
            {execution.timeline.length === 0 && (
              <li className="text-sm text-muted">No timeline events yet.</li>
            )}
          </ol>
        </section>

        <section className="rounded-xl border border-border bg-surface-elevated p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Task plan</h3>
          <ul className="space-y-2">
            {execution.plan.steps.map((step) => (
              <li
                key={step.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
              >
                <div>
                  <p className="text-foreground">{step.title}</p>
                  {step.assignedAgentType && (
                    <p className="text-xs text-muted">
                      {agentLabel(step.assignedAgentType)}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase",
                    step.status === "completed" &&
                      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                    step.status === "awaiting_approval" &&
                      "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                    step.status === "in_progress" &&
                      "bg-sky-500/15 text-sky-700 dark:text-sky-400",
                    (step.status === "pending" || step.status === "skipped") &&
                      "bg-surface text-muted"
                  )}
                >
                  {step.status.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {report && (
          <section className="rounded-xl border border-border bg-surface-elevated p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Task report</h3>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs text-muted">Objective</dt>
                <dd className="text-foreground">{report.objectiveLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Outcome</dt>
                <dd className="text-foreground">{report.outcome}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Time taken</dt>
                <dd className="text-foreground">{report.totalMinutes} minutes</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">AI employees</dt>
                <dd className="text-foreground">
                  {report.agentsInvolved.map(agentLabel).join(", ")}
                </dd>
              </div>
            </dl>
            {report.actionsPerformed.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted">
                  Actions
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-foreground">
                  {report.actionsPerformed.map((a) => (
                    <li key={a}>· {a}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.humanDecisions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted">
                  Human decisions
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-foreground">
                  {report.humanDecisions.map((a) => (
                    <li key={a}>· {a}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.suggestions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted">
                  AI suggestions
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-foreground">
                  {report.suggestions.map((a) => (
                    <li key={a}>· {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}

export const metadata = { title: "Task Detail" };
