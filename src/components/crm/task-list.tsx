"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Clock, Play } from "lucide-react";
import { DeleteEntityButton } from "@/components/crm/delete-entity-button";
import { EditTaskForm } from "@/components/crm/edit-task-form";
import { AssignOwnerField } from "@/components/crm/crm-manual-forms";
import { Button } from "@/components/ui/button";
import type { MemberOption } from "@/lib/crm/members";
import { getAgentDefinition, isAgentType } from "@/lib/workforce/agents";
import type { CrmTask } from "@/types/crm";
import { cn } from "@/lib/utils";

const statusIcon = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
};

const priorityTone = {
  low: "bg-surface-muted text-muted",
  medium: "bg-gold/12 text-gold-bright",
  high: "bg-danger/12 text-danger",
};

export function TaskList({
  tasks: initialTasks,
  members,
  emptyTitle = "Nothing here yet",
  emptyDescription,
}: {
  tasks: CrmTask[];
  members: MemberOption[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [executingId, setExecutingId] = useState<string | null>(null);

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

  async function executeWithAgent(task: CrmTask) {
    if (!task.assignedAgentType) return;
    setExecutingId(task.id);
    try {
      const res = await fetch(`/api/workforce/tasks/${task.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType: task.assignedAgentType }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setExecutingId(null);
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center">
        <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
        {emptyDescription ? (
          <p className="mt-1 text-xs text-muted">{emptyDescription}</p>
        ) : null}
      </div>
    );
  }

  function assigneeName(userId?: string) {
    if (!userId) return null;
    return members.find((m) => m.userId === userId)?.name ?? userId;
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => {
        const Icon = statusIcon[task.status];
        const agentLabel =
          task.assignedAgentType && isAgentType(task.assignedAgentType)
            ? getAgentDefinition(task.assignedAgentType).name
            : task.assignedAgentType;
        return (
          <li
            key={task.id}
            className="rounded-xl border border-border/80 bg-surface-elevated p-3"
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => cycleStatus(task)}
                className={cn(
                  "mt-0.5 shrink-0 rounded-full p-0.5 transition-colors",
                  task.status === "done"
                    ? "text-accent-cyan"
                    : "text-gold hover:bg-gold/10"
                )}
                title="Click to advance status"
              >
                <Icon className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium text-foreground",
                      task.status === "done" && "line-through text-muted"
                    )}
                  >
                    {task.title}
                  </p>
                  {task.description ? (
                    <p className="mt-0.5 text-xs text-muted">{task.description}</p>
                  ) : null}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                        priorityTone[task.priority]
                      )}
                    >
                      {task.priority}
                    </span>
                    {task.dueDate ? (
                      <span className="text-[10px] text-muted">
                        Due {task.dueDate}
                      </span>
                    ) : null}
                    {agentLabel ? (
                      <span className="text-[10px] text-gold">AI: {agentLabel}</span>
                    ) : null}
                    {task.source === "ai" && !agentLabel ? (
                      <span className="text-[10px] text-gold">AI-created</span>
                    ) : null}
                    {task.agentRunId ? (
                      <Link
                        href={`/workforce/runs/${task.agentRunId}`}
                        className="text-[10px] text-gold hover:underline"
                      >
                        View run
                      </Link>
                    ) : null}
                  </div>
                </div>
                {!task.assignedAgentType ? (
                  <div className="max-w-xs">
                    <AssignOwnerField
                      members={members}
                      value={task.assignedTo}
                      compact
                      onSave={(userId) => assignTask(task.id, userId)}
                    />
                    {task.assignedTo ? (
                      <p className="mt-1 text-[10px] text-muted">
                        Assigned: {assigneeName(task.assignedTo)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-1">
                  {task.assignedAgentType && task.status !== "done" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-7 px-2 text-[10px]"
                      disabled={executingId !== null}
                      onClick={() => void executeWithAgent(task)}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      {executingId === task.id ? "Working…" : "Complete with agent"}
                    </Button>
                  ) : null}
                  <EditTaskForm task={task} members={members} />
                  <DeleteEntityButton entity="tasks" id={task.id} label="task" />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
