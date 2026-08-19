import { Suspense } from "react";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { CreateTaskForm } from "@/components/crm/create-task-form";
import { CrmImportForm } from "@/components/crm/crm-import-form";
import { CrmShell, CrmToolbar } from "@/components/crm/crm-shell";
import { SeedCrmSampleButton } from "@/components/crm/seed-crm-sample-button";
import { TaskFilters } from "@/components/crm/task-filters";
import { TaskList } from "@/components/crm/task-list";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions } from "@/lib/crm/members";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function ActivityPage({
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

  const columns = [
    { title: "To do", hint: "Not started", tasks: todo },
    { title: "In progress", hint: "Being worked", tasks: inProgress },
    { title: "Done", hint: "Closed", tasks: done },
  ];

  return (
    <CrmShell
      title="Activity"
      description="Open work across relationships — tasks, follow-ups, and AI-created actions."
      actions={<AskAiButton module="crm" />}
    >
      <CrmToolbar>
        <div className="min-w-[min(100%,24rem)] flex-1">
          <CreateTaskForm members={memberOptions} />
        </div>
        <CrmImportForm entity="tasks" />
        <SeedCrmSampleButton />
      </CrmToolbar>
      <Suspense fallback={null}>
        <TaskFilters members={memberOptions} />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column) => (
          <section
            key={column.title}
            className="rounded-2xl border border-border/80 bg-surface-muted/40 p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {column.title}
                </h2>
                <p className="text-[11px] text-muted">{column.hint}</p>
              </div>
              <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ring-border">
                {column.tasks.length}
              </span>
            </div>
            <TaskList tasks={column.tasks} members={memberOptions} />
          </section>
        ))}
      </div>
    </CrmShell>
  );
}

export const metadata = { title: "Activity" };
