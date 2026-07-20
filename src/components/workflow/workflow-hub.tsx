"use client";

import { useState } from "react";
import { WorkflowBuilder } from "@/components/workflow/workflow-builder";
import { WorkflowList } from "@/components/workflow/workflow-list";
import { WorkflowRunList } from "@/components/workflow/workflow-run-list";
import { WorkflowTemplatesGallery } from "@/components/workflow/workflow-templates-gallery";
import { cn } from "@/lib/utils";
import type { Workflow, WorkflowRun } from "@/types/workflow";

type Tab = "automations" | "templates" | "runs";

type Template = Omit<
  Workflow,
  "id" | "createdAt" | "updatedAt" | "tenantId" | "workspaceId" | "companyId"
>;

export function WorkflowHub({
  workflows,
  runs,
  templates,
}: {
  workflows: Workflow[];
  runs: WorkflowRun[];
  templates: Template[];
}) {
  const [tab, setTab] = useState<Tab>("automations");

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "automations", label: `My automations (${workflows.length})` },
    { id: "templates", label: `Templates (${templates.length})` },
    { id: "runs", label: `Run history (${runs.length})` },
  ];

  return (
    <div className="space-y-6">
      <WorkflowBuilder />

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              tab === item.id
                ? "bg-gold/15 font-medium text-gold-bright"
                : "text-muted hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "automations" && <WorkflowList workflows={workflows} />}
      {tab === "templates" && <WorkflowTemplatesGallery templates={templates} />}
      {tab === "runs" && <WorkflowRunList runs={runs} />}
    </div>
  );
}
