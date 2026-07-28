"use client";

import { useState, type ReactNode } from "react";
import { MessageCircle, Target, Sparkles, type LucideIcon } from "lucide-react";
import { WorkflowBuilder } from "@/components/workflow/workflow-builder";
import { WorkflowList } from "@/components/workflow/workflow-list";
import { WorkflowNav } from "@/components/workflow/workflow-nav";
import { WorkflowRunList } from "@/components/workflow/workflow-run-list";
import { WorkflowTemplatesGallery } from "@/components/workflow/workflow-templates-gallery";
import { FlowPanel } from "@/components/workflow/workflow-shell";
import type { Workflow, WorkflowRun } from "@/types/workflow";

type Tab = "automations" | "templates" | "runs";

type Template = Omit<
  Workflow,
  "id" | "createdAt" | "updatedAt" | "tenantId" | "workspaceId" | "companyId"
>;

const HOW_STEPS: Array<{ icon: LucideIcon; title: string; body: string; color: string; soft: string }> = [
  {
    icon: Sparkles,
    title: "Pick a playbook",
    body: "Install a BDM play or describe one in plain English.",
    color: "var(--flow-accent)",
    soft: "var(--flow-accent-soft)",
  },
  {
    icon: Target,
    title: "It triggers",
    body: "On lead score, deal update, or when you hit Test run.",
    color: "var(--flow-cyan)",
    soft: "var(--flow-cyan-soft)",
  },
  {
    icon: MessageCircle,
    title: "Real BDM work",
    body: "WhatsApp, email, tags, stages, tasks, meetings, approvals.",
    color: "var(--flow-emerald)",
    soft: "var(--flow-emerald-soft)",
  },
];

export function WorkflowHub({
  workflows,
  runs,
  templates,
  header,
}: {
  workflows: Workflow[];
  runs: WorkflowRun[];
  templates: Template[];
  header: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("templates");

  return (
    <>
      {header}
      <WorkflowNav activeTab={tab} onTabChange={setTab} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {HOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <FlowPanel key={step.title} className="!p-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: step.soft, color: step.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p
                    className="mt-3 text-sm font-semibold"
                    style={{ color: "var(--flow-ink)" }}
                  >
                    {step.title}
                  </p>
                  <p
                    className="mt-1 text-xs leading-relaxed"
                    style={{ color: "var(--flow-muted)" }}
                  >
                    {step.body}
                  </p>
                </FlowPanel>
              );
            })}
          </div>

          <WorkflowBuilder />

          {tab === "templates" && (
            <WorkflowTemplatesGallery templates={templates} />
          )}
          {tab === "automations" && <WorkflowList workflows={workflows} />}
          {tab === "runs" && (
            <FlowPanel className="!p-0 overflow-hidden">
              <div className="border-b px-5 py-4" style={{ borderColor: "var(--flow-line)" }}>
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--flow-ink)" }}
                >
                  Run history
                </h3>
              </div>
              <div className="p-2">
                <WorkflowRunList runs={runs} />
              </div>
            </FlowPanel>
          )}
        </div>
      </div>
    </>
  );
}
