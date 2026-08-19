import Link from "next/link";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { CrmSection, CrmShell } from "@/components/crm/crm-shell";
import { CrmTimeline } from "@/components/crm/crm-timeline";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { cn } from "@/lib/utils";

function isOverdue(dueDate: string) {
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  return due.getTime() < Date.now();
}

export default async function CalendarPage() {
  const scope = await getTenantScope();
  const [tasks, activities] = await Promise.all([
    getCrmRepository().listTasks(scope),
    getCrmRepository().listActivities(scope),
  ]);

  const datedTasks = tasks
    .filter((t) => t.dueDate && t.status !== "done")
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    );

  const meetings = activities
    .filter((a) => a.type === "meeting" || a.type === "call")
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
    .slice(0, 20);

  return (
    <CrmShell
      title="Calendar"
      description="Upcoming due work and recent meetings or calls."
      actions={<AskAiButton module="crm" />}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <CrmSection title="Due soon">
          {datedTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Add due dates to tasks and they will show up here.
            </p>
          ) : (
            <ul className="space-y-2">
              {datedTasks.map((task) => {
                const overdue = isOverdue(task.dueDate!);
                return (
                  <li key={task.id}>
                    <Link
                      href="/crm/activity"
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/80 px-3 py-2.5 text-sm transition hover:border-gold/35 hover:bg-surface-muted"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">
                          {task.title}
                        </span>
                        <span className="text-[11px] capitalize text-muted">
                          {task.priority} priority
                        </span>
                      </span>
                      <time
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          overdue
                            ? "bg-danger/12 text-danger"
                            : "bg-surface-muted text-muted"
                        )}
                      >
                        {new Date(task.dueDate!).toLocaleDateString()}
                      </time>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CrmSection>

        <CrmSection title="Meetings & calls">
          {meetings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Log a call or meeting from a deal or person record.
            </p>
          ) : (
            <CrmTimeline items={meetings} empty="No meetings or calls yet." />
          )}
        </CrmSection>
      </div>
    </CrmShell>
  );
}

export const metadata = { title: "Calendar" };
