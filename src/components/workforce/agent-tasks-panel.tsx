import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CrmTask } from "@/types/crm";
import { formatRelative } from "@/lib/utils";

const priorityColors: Record<CrmTask["priority"], string> = {
  low: "bg-slate-950/60 text-slate-300 ring-slate-700/50",
  medium: "bg-amber-950/60 text-amber-300 ring-amber-700/50",
  high: "bg-red-950/60 text-red-300 ring-red-700/50",
};

export function AgentTasksPanel({ tasks }: { tasks: CrmTask[] }) {
  if (tasks.length === 0) {
    return (
      <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
        <h3 className="text-sm font-semibold text-[#F5E6C8]">Agent tasks</h3>
        <p className="mt-2 text-sm text-[#A89878]">
          No tasks assigned to this agent yet. Run the agent and apply actions to
          create tasks automatically.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#F5E6C8]">Agent tasks</h3>
        <Link href="/crm/tasks" className="text-xs text-[#D4AF37] hover:underline">
          View all in CRM →
        </Link>
      </div>
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="rounded-lg border border-[#3d3528] bg-[#141414] p-4"
          >
            <div className="flex items-start gap-3">
              {task.status === "done" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#A89878]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#F5E6C8]">{task.title}</p>
                {task.description && (
                  <p className="mt-1 text-xs text-[#A89878]">{task.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                  <Badge className="bg-[#0a0a0a] text-[#A89878] ring-[#3d3528]">
                    {task.status.replace("_", " ")}
                  </Badge>
                  {task.dueDate && (
                    <span className="text-[10px] text-[#A89878]">
                      Due {task.dueDate}
                    </span>
                  )}
                  <span className="text-[10px] text-[#A89878]">
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
