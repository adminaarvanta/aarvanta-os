import Link from "next/link";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { CrmNav } from "@/components/crm/crm-nav";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";

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
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Calendar
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              Upcoming due work and recent meetings/calls.
            </p>
          </div>
          <AskAiButton module="crm" />
        </div>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        <section className="rounded-xl border border-border bg-surface-elevated p-5">
          <h3 className="text-sm font-semibold text-foreground">Due soon</h3>
          <ul className="mt-3 space-y-2">
            {datedTasks.map((task) => (
              <li key={task.id}>
                <Link
                  href="/crm/activity"
                  className="flex flex-col gap-0.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-muted sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-foreground">
                    {task.title}
                  </span>
                  <span className="text-xs text-muted">
                    Due {new Date(task.dueDate!).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
            {datedTasks.length === 0 && (
              <p className="text-sm text-muted">No dated open tasks.</p>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-surface-elevated p-5">
          <h3 className="text-sm font-semibold text-foreground">
            Recent meetings & calls
          </h3>
          <ul className="mt-3 space-y-2">
            {meetings.map((activity) => (
              <li
                key={activity.id}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                <p className="font-medium text-foreground">
                  [{activity.type}] {activity.title}
                </p>
                <p className="text-xs text-muted">
                  {new Date(activity.occurredAt).toLocaleString()}
                </p>
              </li>
            ))}
            {meetings.length === 0 && (
              <p className="text-sm text-muted">
                No meetings or calls logged yet.
              </p>
            )}
          </ul>
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "Calendar" };
