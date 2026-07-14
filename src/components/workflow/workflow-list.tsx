import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RunWorkflowButton } from "@/components/workflow/run-workflow-button";
import type { Workflow } from "@/types/workflow";
import { formatRelative } from "@/lib/utils";

export function WorkflowList({ workflows }: { workflows: Workflow[] }) {
  if (!workflows.length) {
    return (
      <p className="text-sm text-muted">
        No workflows yet. Use a template to get started.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {workflows.map((workflow) => (
        <li
          key={workflow.id}
          className="rounded-xl border border-border bg-surface-elevated p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={`/workflows/${workflow.id}`}
                className="font-semibold text-foreground hover:text-gold-bright"
              >
                {workflow.name}
              </Link>
              {workflow.description && (
                <p className="mt-1 text-xs text-muted">{workflow.description}</p>
              )}
            </div>
            <Badge
              className={
                workflow.enabled
                  ? "bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/30"
                  : "bg-danger/15 text-danger ring-danger/45"
              }
            >
              {workflow.enabled ? "Active" : "Off"}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            <Badge className="bg-surface-muted text-muted ring-border">
              {workflow.trigger.label}
            </Badge>
            <Badge className="bg-surface-muted text-muted ring-border">
              {workflow.steps.length} steps
            </Badge>
            {workflow.tags.map((tag) => (
              <Badge key={tag} className="bg-surface-muted text-muted ring-border">
                {tag}
              </Badge>
            ))}
          </div>

          <p className="mt-3 text-[10px] text-muted">
            Updated {formatRelative(workflow.updatedAt)}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <RunWorkflowButton workflowId={workflow.id} label="Run" />
            <Link
              href={`/workflows/${workflow.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm text-muted hover:border-gold/40 hover:text-foreground"
            >
              View builder
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
