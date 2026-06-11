import { CrmNav } from "@/components/crm/crm-nav";
import { TaskList } from "@/components/crm/task-list";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function TasksPage() {
  const scope = await getTenantScope();
  const tasks = await getCrmRepository().listTasks(scope);

  const todo = tasks.filter((t) => t.status === "todo");
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-[#F5E6C8] sm:text-xl">Tasks</h2>
        <p className="text-xs text-[#A89878] sm:text-sm">
          Manual and AI-created tasks — tap status icon to advance.
        </p>
      </header>
      <CrmNav />
      <div className="flex-1 overflow-y-auto p-4 space-y-6 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-[#F5E6C8]">
              To do ({todo.length})
            </h3>
            <TaskList tasks={todo} />
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-[#F5E6C8]">
              In progress ({inProgress.length})
            </h3>
            <TaskList tasks={inProgress} />
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-[#F5E6C8]">
              Done ({done.length})
            </h3>
            <TaskList tasks={done} />
          </section>
        </div>
      </div>
    </>
  );
}

export const metadata = { title: "Tasks" };
