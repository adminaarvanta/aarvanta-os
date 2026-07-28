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
  const [tab, setTab] = useState<Tab>("templates");

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "templates", label: `BDM playbooks (${templates.length})` },
    { id: "automations", label: `My plays (${workflows.length})` },
    { id: "runs", label: `Run history (${runs.length})` },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface-elevated p-4 text-sm text-muted">
        <p className="font-medium text-foreground">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Install a BDM playbook (or describe one in plain English).</li>
          <li>It runs on a lead score / deal update, or when you click Test run.</li>
          <li>
            Steps do real work: WhatsApp/email, CRM tags &amp; stages, tasks,
            meetings, AI assist, approvals.
          </li>
        </ol>
      </div>

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

      {tab === "templates" && <WorkflowTemplatesGallery templates={templates} />}
      {tab === "automations" && <WorkflowList workflows={workflows} />}
      {tab === "runs" && <WorkflowRunList runs={runs} />}
    </div>
  );
}
