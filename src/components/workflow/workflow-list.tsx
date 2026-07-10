import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RunWorkflowButton } from "@/components/workflow/run-workflow-button";
import type { Workflow } from "@/types/workflow";
import { formatRelative } from "@/lib/utils";

export function WorkflowList({ workflows }: { workflows: Workflow[] }) {
  if (!workflows.length) {
    return (
      <p className="text-sm text-[#9AABC4]">
        No workflows yet. Use a template to get started.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {workflows.map((workflow) => (
        <li
          key={workflow.id}
          className="rounded-xl border border-[#243656] bg-[#0D1524] p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={`/workflows/${workflow.id}`}
                className="font-semibold text-[#FFFFFF] hover:text-[#C9AA72]"
              >
                {workflow.name}
              </Link>
              {workflow.description && (
                <p className="mt-1 text-xs text-[#9AABC4]">{workflow.description}</p>
              )}
            </div>
            <Badge
              className={
                workflow.enabled
                  ? "bg-emerald-950/60 text-emerald-300 ring-emerald-700/50"
                  : "bg-red-950/60 text-red-300 ring-red-700/50"
              }
            >
              {workflow.enabled ? "Active" : "Off"}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            <Badge className="bg-[#121E32] text-[#9AABC4] ring-[#243656]">
              {workflow.trigger.label}
            </Badge>
            <Badge className="bg-[#121E32] text-[#9AABC4] ring-[#243656]">
              {workflow.steps.length} steps
            </Badge>
            {workflow.tags.map((tag) => (
              <Badge key={tag} className="bg-[#121E32] text-[#9AABC4] ring-[#243656]">
                {tag}
              </Badge>
            ))}
          </div>

          <p className="mt-3 text-[10px] text-[#9AABC4]">
            Updated {formatRelative(workflow.updatedAt)}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <RunWorkflowButton workflowId={workflow.id} label="Run" />
            <Link
              href={`/workflows/${workflow.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-[#243656] px-4 py-2 text-sm text-[#9AABC4] hover:border-[#B8965D]/40 hover:text-[#FFFFFF]"
            >
              View builder
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
