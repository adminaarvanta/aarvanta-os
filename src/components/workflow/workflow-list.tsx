"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RunWorkflowButton } from "@/components/workflow/run-workflow-button";
import { WorkflowEnableToggle } from "@/components/workflow/workflow-enable-toggle";
import type { Workflow } from "@/types/workflow";
import { formatRelative } from "@/lib/utils";

export function WorkflowList({ workflows }: { workflows: Workflow[] }) {
  if (!workflows.length) {
    return (
      <p className="text-sm text-muted">
        No automations yet. Install a template or describe a workflow to create one.
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
            <WorkflowEnableToggle workflow={workflow} />
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
              Edit
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
