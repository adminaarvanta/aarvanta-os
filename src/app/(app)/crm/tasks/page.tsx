import { Suspense } from "react";
import { CrmNav } from "@/components/crm/crm-nav";
import { CreateTaskForm } from "@/components/crm/create-task-form";
import { TaskFilters } from "@/components/crm/task-filters";
import { TaskList } from "@/components/crm/task-list";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions } from "@/lib/crm/members";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ assignedTo?: string }>;
}) {
  const scope = await getTenantScope();
  const { assignedTo } = await searchParams;

  const [tasks, members] = await Promise.all([
    getCrmRepository().listTasks(
      scope,
      assignedTo ? { assignedTo } : undefined
    ),
    getTenantRepository().listMembers(scope),
  ]);

  const memberOptions = activeMemberOptions(members);

  const todo = tasks.filter((t) => t.status === "todo");
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-[#F5E6C8] sm:text-xl">Tasks</h2>
        <p className="text-xs text-[#A89878] sm:text-sm">
          Create, assign, and track tasks manually — or let AI create them from inbound leads.
        </p>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        <CreateTaskForm members={memberOptions} />
        <Suspense fallback={null}>
          <TaskFilters members={memberOptions} />
        </Suspense>

        <div className="grid gap-6 lg:grid-cols-3">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-[#F5E6C8]">
              To do ({todo.length})
            </h3>
            <TaskList tasks={todo} members={memberOptions} />
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-[#F5E6C8]">
              In progress ({inProgress.length})
            </h3>
            <TaskList tasks={inProgress} members={memberOptions} />
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-[#F5E6C8]">
              Done ({done.length})
            </h3>
            <TaskList tasks={done} members={memberOptions} />
          </section>
        </div>
      </div>
    </>
  );
}

export const metadata = { title: "Tasks" };
