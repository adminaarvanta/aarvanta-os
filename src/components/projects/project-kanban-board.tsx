"use client";

import { useRouter } from "next/navigation";
import type { ProjectTask, ProjectTaskStatus } from "@/types/project";
import { cn } from "@/lib/utils";

const columns: { id: ProjectTaskStatus; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
];

const priorityColors = {
  low: "border-l-slate-600",
  medium: "border-l-amber-600",
  high: "border-l-red-600",
};

export function ProjectKanbanBoard({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: ProjectTask[];
}) {
  const router = useRouter();

  async function moveTask(taskId: string, status: ProjectTaskStatus) {
    await fetch(`/api/projects/${projectId}/tasks?taskId=${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <section
            key={col.id}
            className="rounded-xl border border-[#243656] bg-[#040608] p-3 min-h-[280px]"
          >
            <h3 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-[#9AABC4]">
              {col.label}{" "}
              <span className="text-[#B8965D]">({colTasks.length})</span>
            </h3>
            <ul className="space-y-2">
              {colTasks.map((task) => (
                <li
                  key={task.id}
                  className={cn(
                    "rounded-lg border border-[#243656] border-l-4 bg-[#0D1524] p-3",
                    priorityColors[task.priority]
                  )}
                >
                  <p className="text-sm font-medium text-[#FFFFFF]">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 text-xs text-[#9AABC4] line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[#9AABC4]">
                    {task.assignee && <span>{task.assignee}</span>}
                    {task.dueDate && <span>Due {task.dueDate}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {columns
                      .filter((c) => c.id !== task.status)
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => moveTask(task.id, c.id)}
                          className="rounded border border-[#243656] px-2 py-0.5 text-[10px] text-[#9AABC4] hover:border-[#B8965D]/40 hover:text-[#FFFFFF]"
                        >
                          → {c.label}
                        </button>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
