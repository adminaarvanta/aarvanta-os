"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Circle, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CrmTask } from "@/types/crm";
import type { AgentType } from "@/types/workforce";
import { formatRelative } from "@/lib/utils";

const priorityColors: Record<CrmTask["priority"], string> = {
  low: "bg-surface-muted text-muted ring-border",
  medium: "bg-gold/10 text-gold-bright ring-gold/35",
  high: "bg-danger/15 text-danger ring-danger/45",
};

export function AgentTasksPanel({
  tasks,
  agentType,
}: {
  tasks: CrmTask[];
  agentType: AgentType;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const openTasks = tasks.filter((t) => t.status !== "done");

  async function executeOne(taskId: string) {
    setBusyId(taskId);
    setMessage(null);
    try {
      const res = await fetch(`/api/workforce/tasks/${taskId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType }),
      });
      const data = (await res.json()) as {
        error?: { message?: string };
        run?: { id: string };
        applied?: unknown[];
      };
      if (!res.ok) {
        setMessage(
          typeof data.error?.message === "string"
            ? data.error.message
            : "Could not complete task"
        );
        return;
      }
      setMessage(
        `Task completed${data.run?.id ? ` · run saved` : ""}${
          Array.isArray(data.applied) ? ` · ${data.applied.length} actions applied` : ""
        }.`
      );
      router.refresh();
    } catch {
      setMessage("Network error while executing task");
    } finally {
      setBusyId(null);
    }
  }

  async function processOpen() {
    setBatchBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/workforce/tasks/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType, limit: 10 }),
      });
      const data = (await res.json()) as {
        error?: unknown;
        processedCount?: number;
        failedCount?: number;
      };
      if (!res.ok) {
        setMessage("Failed to process open tasks");
        return;
      }
      setMessage(
        `Processed ${data.processedCount ?? 0} task(s)${
          data.failedCount ? `, ${data.failedCount} failed` : ""
        }.`
      );
      router.refresh();
    } catch {
      setMessage("Network error while processing tasks");
    } finally {
      setBatchBusy(false);
    }
  }

  if (tasks.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-surface-elevated p-5">
        <h3 className="text-sm font-semibold text-foreground">Agent tasks</h3>
        <p className="mt-2 text-sm text-muted">
          No CRM tasks assigned to this agent yet. Assign a task from CRM Tasks
          (choose this agent), or run the agent and apply create-task actions.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-surface-elevated p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Agent tasks</h3>
        <div className="flex flex-wrap items-center gap-2">
          {openTasks.length > 0 && (
            <Button
              type="button"
              size="sm"
              onClick={() => void processOpen()}
              disabled={batchBusy || busyId !== null}
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {batchBusy ? "Working…" : `Work on open (${openTasks.length})`}
            </Button>
          )}
          <Link href="/crm/tasks" className="text-xs text-gold hover:underline">
            View all in CRM →
          </Link>
        </div>
      </div>
      {message && <p className="mb-3 text-xs text-muted">{message}</p>}
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="rounded-lg border border-border bg-surface-muted p-4"
          >
            <div className="flex items-start gap-3">
              {task.status === "done" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-cyan" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{task.title}</p>
                {task.description && (
                  <p className="mt-1 text-xs text-muted">{task.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                  <Badge className="bg-background text-muted ring-border">
                    {task.status.replace("_", " ")}
                  </Badge>
                  {task.dueDate && (
                    <span className="text-[10px] text-muted">
                      Due {task.dueDate}
                    </span>
                  )}
                  <span className="text-[10px] text-muted">
                    {formatRelative(task.updatedAt)}
                  </span>
                  {task.agentRunId && (
                    <Link
                      href={`/workforce/runs/${task.agentRunId}`}
                      className="text-[10px] text-gold hover:underline"
                    >
                      View run
                    </Link>
                  )}
                </div>
                {task.status !== "done" && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busyId !== null || batchBusy}
                      onClick={() => void executeOne(task.id)}
                    >
                      <Play className="mr-1.5 h-3.5 w-3.5" />
                      {busyId === task.id ? "Working…" : "Complete with agent"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
