import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CrmTask } from "@/types/crm";
import { formatRelative } from "@/lib/utils";

const priorityColors: Record<CrmTask["priority"], string> = {
  low: "bg-[#121E32] text-[#9AABC4] ring-[#243656]",
  medium: "bg-[#2A2210] text-[#C9AA72] ring-[#B8965D]/35",
  high: "bg-[#2A1218] text-[#F0A0A8] ring-[#8B3A45]/45",
};

export function AgentTasksPanel({ tasks }: { tasks: CrmTask[] }) {
  if (tasks.length === 0) {
    return (
      <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5">
        <h3 className="text-sm font-semibold text-[#FFFFFF]">Agent tasks</h3>
        <p className="mt-2 text-sm text-[#9AABC4]">
          No tasks assigned to this agent yet. Run the agent and apply actions to
          create tasks automatically.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#FFFFFF]">Agent tasks</h3>
        <Link href="/crm/tasks" className="text-xs text-[#B8965D] hover:underline">
          View all in CRM →
        </Link>
      </div>
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="rounded-lg border border-[#243656] bg-[#121E32] p-4"
          >
            <div className="flex items-start gap-3">
              {task.status === "done" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4DA6FF]" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#9AABC4]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#FFFFFF]">{task.title}</p>
                {task.description && (
                  <p className="mt-1 text-xs text-[#9AABC4]">{task.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                  <Badge className="bg-[#040608] text-[#9AABC4] ring-[#243656]">
                    {task.status.replace("_", " ")}
                  </Badge>
                  {task.dueDate && (
                    <span className="text-[10px] text-[#9AABC4]">
                      Due {task.dueDate}
                    </span>
                  )}
                  <span className="text-[10px] text-[#9AABC4]">
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
