import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { CreateTaskForm } from "@/components/crm/create-task-form";
import { CrmEmptyState, CrmSection, CrmShell, CrmToolbar } from "@/components/crm/crm-shell";
import { CrmTimeline } from "@/components/crm/crm-timeline";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions } from "@/lib/crm/members";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getTenantScope } from "@/lib/tenant/context";
import { cn } from "@/lib/utils";

function isOverdue(dueDate: string) {
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  return due.getTime() < Date.now();
}

function isToday(dueDate: string) {
  const due = new Date(dueDate);
  const now = new Date();
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

function dayKey(dueDate: string) {
  const parsed = dueDate.includes("T") ? parseISO(dueDate) : new Date(dueDate);
  return format(parsed, "yyyy-MM-dd");
}

function dayLabel(dueDate: string) {
  const parsed = dueDate.includes("T") ? parseISO(dueDate) : new Date(dueDate);
  if (isToday(dueDate)) return "Today";
  return format(parsed, "EEEE, d MMM");
}

export default async function CalendarPage() {
  const scope = await getTenantScope();
  const repo = getCrmRepository();
  const [tasks, activities, companies, members] = await Promise.all([
    repo.listTasks(scope),
    repo.listActivities(scope),
    repo.listCompanies(scope),
    getTenantRepository().listMembers(scope),
  ]);
  const memberOptions = activeMemberOptions(members);

  const datedTasks = tasks
    .filter((t) => t.dueDate && t.status !== "done")
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    );

  const agenda = datedTasks.reduce<
    Array<{ key: string; label: string; overdue: boolean; tasks: typeof datedTasks }>
  >((groups, task) => {
    const key = dayKey(task.dueDate!);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.tasks.push(task);
      return groups;
    }
    groups.push({
      key,
      label: dayLabel(task.dueDate!),
      overdue: isOverdue(task.dueDate!) && !isToday(task.dueDate!),
      tasks: [task],
    });
    return groups;
  }, []);

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
      <CrmToolbar>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <CreateTaskForm
            members={memberOptions}
            companies={companies.map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>
      </CrmToolbar>
      <div className="grid gap-4 lg:grid-cols-2">
        <CrmSection title="Due soon" accent="rose">
          {agenda.length === 0 ? (
            <CrmEmptyState
              icon={CalendarDays}
              accent="rose"
              title="Nothing scheduled"
              description="Add due dates to tasks and they will show up here as an agenda."
            />
          ) : (
            <div className="space-y-4">
              {agenda.map((day) => (
                <div key={day.key}>
                  <p
                    className={cn(
                      "mb-2 text-[11px] font-semibold uppercase tracking-wide",
                      day.overdue ? "text-rose-600 dark:text-rose-300" : "text-gold"
                    )}
                  >
                    {day.label}
                    {day.overdue ? " · Overdue" : ""}
                  </p>
                  <ul className="space-y-2">
                    {day.tasks.map((task) => {
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
                                  ? "bg-rose-500/12 text-rose-700 dark:text-rose-200"
                                  : "bg-cyan-500/12 text-cyan-700 dark:text-cyan-200"
                              )}
                            >
                              {overdue ? "Overdue" : "Upcoming"}
                            </time>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CrmSection>

        <CrmSection title="Meetings & calls" accent="navy">
          {meetings.length === 0 ? (
            <CrmEmptyState
              icon={CalendarDays}
              accent="navy"
              title="No meetings or calls"
              description="Log a call or meeting from a deal or person record."
            />
          ) : (
            <CrmTimeline items={meetings} empty="No meetings or calls yet." />
          )}
        </CrmSection>
      </div>
    </CrmShell>
  );
}

export const metadata = { title: "Calendar" };
