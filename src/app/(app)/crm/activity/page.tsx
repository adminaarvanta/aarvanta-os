import { Suspense } from "react";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { CreateTaskForm } from "@/components/crm/create-task-form";
import { CrmImportForm } from "@/components/crm/crm-import-form";
import { CrmSection, CrmShell, CrmToolbar, type CrmAccent } from "@/components/crm/crm-shell";
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

  const columns: Array<{
    title: string;
    hint: string;
    accent: CrmAccent;
    tasks: typeof todo;
    emptyTitle: string;
    emptyDescription: string;
  }> = [
    {
      title: "To do",
      hint: "Not started",
      accent: "rose",
      tasks: todo,
      emptyTitle: "Nothing to start",
      emptyDescription: "Create a follow-up or import tasks to fill this column.",
    },
    {
      title: "In progress",
      hint: "Being worked",
      accent: "cyan",
      tasks: inProgress,
      emptyTitle: "Nothing in motion",
      emptyDescription: "Click a to-do to start working it.",
    },
    {
      title: "Done",
      hint: "Closed",
      accent: "emerald",
      tasks: done,
      emptyTitle: "Nothing closed yet",
      emptyDescription: "Completed work lands here.",
    },
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
          <CrmSection
            key={column.title}
            title={column.title}
            accent={column.accent}
            action={
              <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ring-border">
                {column.tasks.length}
              </span>
            }
          >
            <p className="-mt-1 mb-3 text-[11px] text-muted">{column.hint}</p>
            <TaskList
              tasks={column.tasks}
              members={memberOptions}
              emptyTitle={column.emptyTitle}
              emptyDescription={column.emptyDescription}
            />
          </CrmSection>
        ))}
      </div>
    </CrmShell>
  );
}

export const metadata = { title: "Activity" };
