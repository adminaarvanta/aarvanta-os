import { Suspense } from "react";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { CrmNav } from "@/components/crm/crm-nav";
import { CreateTaskForm } from "@/components/crm/create-task-form";
import { CrmImportForm } from "@/components/crm/crm-import-form";
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

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Activity
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              Open work across relationships — tasks, follow-ups, and AI-created
              actions.
            </p>
          </div>
          <AskAiButton module="crm" />
        </div>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-[min(100%,24rem)] flex-1">
            <CreateTaskForm members={memberOptions} />
          </div>
          <CrmImportForm entity="tasks" />
          <SeedCrmSampleButton />
        </div>
        <Suspense fallback={null}>
          <TaskFilters members={memberOptions} />
        </Suspense>

        <div className="grid gap-6 lg:grid-cols-3">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              To do ({todo.length})
            </h3>
            <TaskList tasks={todo} members={memberOptions} />
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              In progress ({inProgress.length})
            </h3>
            <TaskList tasks={inProgress} members={memberOptions} />
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Done ({done.length})
            </h3>
            <TaskList tasks={done} members={memberOptions} />
          </section>
        </div>
      </div>
    </>
  );
}

export const metadata = { title: "Activity" };
