import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CrmTask } from "@/types/crm";
import { formatRelative } from "@/lib/utils";

const priorityColors: Record<CrmTask["priority"], string> = {
  low: "bg-surface-muted text-muted ring-border",
  medium: "bg-gold/10 text-gold-bright ring-gold/35",
  high: "bg-danger/15 text-danger ring-danger/45",
};

export function AgentTasksPanel({ tasks }: { tasks: CrmTask[] }) {
  if (tasks.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-surface-elevated p-5">
        <h3 className="text-sm font-semibold text-foreground">Agent tasks</h3>
        <p className="mt-2 text-sm text-muted">
          No tasks assigned to this agent yet. Run the agent and apply actions to
          create tasks automatically.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-surface-elevated p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Agent tasks</h3>
        <Link href="/crm/tasks" className="text-xs text-gold hover:underline">
          View all in CRM →
        </Link>
      </div>
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
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
