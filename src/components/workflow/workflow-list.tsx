import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RunWorkflowButton } from "@/components/workflow/run-workflow-button";
import type { Workflow } from "@/types/workflow";
import { formatRelative } from "@/lib/utils";

export function WorkflowList({ workflows }: { workflows: Workflow[] }) {
  if (!workflows.length) {
    return (
      <p className="text-sm text-[#A89878]">
        No workflows yet. Use a template to get started.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {workflows.map((workflow) => (
        <li
          key={workflow.id}
          className="rounded-xl border border-[#3d3528] bg-[#101010] p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={`/workflows/${workflow.id}`}
                className="font-semibold text-[#F5E6C8] hover:text-[#F9E076]"
              >
                {workflow.name}
              </Link>
              {workflow.description && (
                <p className="mt-1 text-xs text-[#A89878]">{workflow.description}</p>
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
            <Badge className="bg-[#141414] text-[#A89878] ring-[#3d3528]">
              {workflow.trigger.label}
            </Badge>
            <Badge className="bg-[#141414] text-[#A89878] ring-[#3d3528]">
              {workflow.steps.length} steps
            </Badge>
            {workflow.tags.map((tag) => (
              <Badge key={tag} className="bg-[#141414] text-[#A89878] ring-[#3d3528]">
                {tag}
              </Badge>
            ))}
          </div>

          <p className="mt-3 text-[10px] text-[#A89878]">
            Updated {formatRelative(workflow.updatedAt)}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <RunWorkflowButton workflowId={workflow.id} label="Run" />
            <Link
              href={`/workflows/${workflow.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-[#3d3528] px-4 py-2 text-sm text-[#A89878] hover:border-[#D4AF37]/40 hover:text-[#F5E6C8]"
            >
              View builder
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
