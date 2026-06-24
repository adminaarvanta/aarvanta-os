"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { MemberSelect } from "@/components/shared/member-select";
import type { MemberOption } from "@/lib/crm/members";
import type { CrmTask } from "@/types/crm";
import { cn } from "@/lib/utils";

const statusIcon = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
};

const priorityColor = {
  low: "text-zinc-400",
  medium: "text-amber-400",
  high: "text-red-400",
};

export function TaskList({
  tasks: initialTasks,
  members,
}: {
  tasks: CrmTask[];
  members: MemberOption[];
}) {
  const [tasks, setTasks] = useState(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  async function cycleStatus(task: CrmTask) {
    const next =
      task.status === "todo"
        ? "in_progress"
        : task.status === "in_progress"
          ? "done"
          : "todo";
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, status: next } : item
      )
    );
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!response.ok) {
      setTasks(initialTasks);
    }
  }

  async function assignTask(taskId: string, assignedTo: string) {
    const previous = tasks;
    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? { ...item, assignedTo: assignedTo || undefined }
          : item
      )
    );
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedTo: assignedTo || undefined }),
    });
    if (!response.ok) {
      setTasks(previous);
    }
  }

  if (tasks.length === 0) {
    return <p className="text-sm text-[#A89878]">No tasks yet.</p>;
  }

  function assigneeName(userId?: string) {
    if (!userId) return null;
    return members.find((m) => m.userId === userId)?.name ?? userId;
  }

  return (
    <ul className="divide-y divide-[#3d3528] rounded-xl border border-[#3d3528] bg-[#101010]">
      {tasks.map((task) => {
        const Icon = statusIcon[task.status];
        return (
          <li key={task.id} className="flex items-start gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => cycleStatus(task)}
              className="mt-0.5 text-[#D4AF37] hover:opacity-80"
              title="Click to advance status"
            >
              <Icon className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p
                  className={cn(
                    "text-sm font-medium text-[#F5E6C8]",
                    task.status === "done" && "line-through text-[#A89878]"
                  )}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="mt-0.5 text-xs text-[#A89878]">{task.description}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[#A89878]">
                  <span className={priorityColor[task.priority]}>
                    {task.priority} priority
                  </span>
                  {task.dueDate && <span>Due {task.dueDate}</span>}
                  {task.source === "ai" && (
                    <span className="text-[#D4AF37]">AI-created</span>
                  )}
                </div>
              </div>
              <div className="max-w-xs">
                <MemberSelect
                  members={members}
                  value={task.assignedTo ?? ""}
                  onChange={(userId) => assignTask(task.id, userId)}
                  placeholder="Assign to…"
                />
                {task.assignedTo && (
                  <p className="mt-1 text-[10px] text-[#A89878]">
                    Assigned: {assigneeName(task.assignedTo)}
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
