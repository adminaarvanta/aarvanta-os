"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Circle, Play } from "lucide-react";
import {
  WfPanel,
  WfPrimaryButton,
  WfSecondaryButton,
} from "@/components/workforce/workforce-shell";
import type { CrmTask } from "@/types/crm";
import type { AgentType } from "@/types/workforce";
import { formatRelative } from "@/lib/utils";

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
        `Task completed${data.run?.id ? " · run saved" : ""}${
          Array.isArray(data.applied)
            ? ` · ${data.applied.length} actions applied`
            : ""
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
      <WfPanel>
        <h3 className="text-sm font-bold" style={{ color: "var(--wf-ink)" }}>
          Agent tasks
        </h3>
        <p className="mt-2 text-sm" style={{ color: "var(--wf-muted)" }}>
          No CRM tasks assigned yet. Start a workforce goal or assign a task from
          CRM.
        </p>
        <Link
          href="/workforce"
          className="mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--wf-accent)" }}
        >
          Start job
        </Link>
      </WfPanel>
    );
  }

  return (
    <WfPanel className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold" style={{ color: "var(--wf-ink)" }}>
          Agent tasks
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {openTasks.length > 0 && (
            <WfPrimaryButton
              type="button"
              disabled={batchBusy || busyId !== null}
              onClick={() => void processOpen()}
              className="!px-4 !py-2 text-xs"
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {batchBusy ? "Working…" : `Work on open (${openTasks.length})`}
            </WfPrimaryButton>
          )}
          <Link
            href="/crm/tasks"
            className="text-xs font-semibold"
            style={{ color: "var(--wf-accent)" }}
          >
            View in CRM →
          </Link>
        </div>
      </div>
      {message && (
        <p className="text-xs" style={{ color: "var(--wf-muted)" }}>
          {message}
        </p>
      )}
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--wf-line)", background: "var(--wf-bg)" }}
          >
            <div className="flex items-start gap-3">
              {task.status === "done" ? (
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "var(--wf-ok)" }}
                />
              ) : (
                <Circle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "var(--wf-muted)" }}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold" style={{ color: "var(--wf-ink)" }}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="mt-1 text-xs" style={{ color: "var(--wf-muted)" }}>
                    {task.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                    style={{
                      background:
                        task.priority === "high"
                          ? "var(--wf-danger-soft)"
                          : "var(--wf-accent-soft)",
                      color:
                        task.priority === "high"
                          ? "var(--wf-danger)"
                          : "var(--wf-accent)",
                    }}
                  >
                    {task.priority}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--wf-muted)" }}
                  >
                    {task.status.replace("_", " ")} ·{" "}
                    {formatRelative(task.updatedAt)}
                  </span>
                  {task.agentRunId && (
                    <Link
                      href={`/workforce/runs/${task.agentRunId}`}
                      className="text-[10px] font-semibold"
                      style={{ color: "var(--wf-accent)" }}
                    >
                      View run
                    </Link>
                  )}
                </div>
                {task.status !== "done" && (
                  <div className="mt-3">
                    <WfSecondaryButton
                      type="button"
                      disabled={busyId !== null || batchBusy}
                      onClick={() => void executeOne(task.id)}
                      className="!px-3 !py-1.5 text-xs"
                    >
                      <Play className="mr-1.5 h-3.5 w-3.5" />
                      {busyId === task.id ? "Working…" : "Complete with agent"}
                    </WfSecondaryButton>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </WfPanel>
  );
}
