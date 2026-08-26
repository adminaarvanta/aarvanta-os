"use client";

import Link from "next/link";
import {
  FlowChip,
  FlowPanel,
  tagTone,
} from "@/components/workflow/workflow-shell";
import { RunWorkflowButton } from "@/components/workflow/run-workflow-button";
import { WorkflowEnableToggle } from "@/components/workflow/workflow-enable-toggle";
import type { Workflow } from "@/types/workflow";
import { formatRelative } from "@/lib/utils";

export function WorkflowList({ workflows }: { workflows: Workflow[] }) {
  if (!workflows.length) {
    return (
      <FlowPanel>
        <p className="text-sm" style={{ color: "var(--flow-muted)" }}>
          No automations yet. Turn one on above, or tell us what you need.
        </p>
      </FlowPanel>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {workflows.map((workflow) => (
        <li key={workflow.id}>
          <FlowPanel className="flex h-full flex-col !p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/workflows/${workflow.id}`}
                  className="font-semibold transition hover:opacity-80"
                  style={{ color: "var(--flow-ink)" }}
                >
                  {workflow.name}
                </Link>
                {workflow.description ? (
                  <p
                    className="mt-1 text-xs leading-relaxed"
                    style={{ color: "var(--flow-muted)" }}
                  >
                    {workflow.description}
                  </p>
                ) : null}
              </div>
              <WorkflowEnableToggle workflow={workflow} />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <FlowChip tone="cyan">{workflow.trigger.label}</FlowChip>
              <FlowChip tone="muted">{workflow.steps.length} steps</FlowChip>
              {workflow.tags.map((tag) => (
                <FlowChip key={tag} tone={tagTone(tag)}>
                  {tag}
                </FlowChip>
              ))}
            </div>

            <p
              className="mt-3 text-[10px]"
              style={{ color: "var(--flow-muted)" }}
            >
              Updated {formatRelative(workflow.updatedAt)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <RunWorkflowButton workflowId={workflow.id} label="Run" />
              <Link
                href={`/workflows/${workflow.id}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.03]"
                style={{
                  borderColor: "var(--flow-accent)",
                  color: "var(--flow-accent)",
                }}
              >
                Edit
              </Link>
            </div>
          </FlowPanel>
        </li>
      ))}
    </ul>
  );
}
