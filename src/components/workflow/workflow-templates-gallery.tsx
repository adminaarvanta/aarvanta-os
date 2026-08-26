"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  FileCheck,
  GitBranch,
  MessageCircle,
  Target,
  type LucideIcon,
} from "lucide-react";
import {
  FlowChip,
  FlowPanel,
  FlowPrimaryButton,
  tagTone,
} from "@/components/workflow/workflow-shell";
import type { Workflow } from "@/types/workflow";

type Template = Omit<
  Workflow,
  "id" | "createdAt" | "updatedAt" | "tenantId" | "workspaceId" | "companyId"
>;

const PLAYBOOK_VISUAL: Record<
  string,
  { icon: LucideIcon; soft: string; fg: string }
> = {
  schedule_team_call: {
    icon: Calendar,
    soft: "var(--flow-amber-soft)",
    fg: "var(--flow-amber)",
  },
  ai_voice_followup: {
    icon: Calendar,
    soft: "var(--flow-accent-soft)",
    fg: "var(--flow-accent)",
  },
  new_lead_chase: {
    icon: Target,
    soft: "var(--flow-rose-soft)",
    fg: "var(--flow-rose)",
  },
  missed_call_callback: {
    icon: MessageCircle,
    soft: "var(--flow-cyan-soft)",
    fg: "var(--flow-cyan)",
  },
  quiet_deal_followup: {
    icon: GitBranch,
    soft: "var(--flow-wait-soft)",
    fg: "var(--flow-wait)",
  },
  deal_won_next_steps: {
    icon: FileCheck,
    soft: "var(--flow-emerald-soft)",
    fg: "var(--flow-emerald)",
  },
  hot_lead_chase: {
    icon: Target,
    soft: "var(--flow-rose-soft)",
    fg: "var(--flow-rose)",
  },
  first_outreach_whatsapp: {
    icon: MessageCircle,
    soft: "var(--flow-emerald-soft)",
    fg: "var(--flow-emerald)",
  },
  book_discovery: {
    icon: Calendar,
    soft: "var(--flow-amber-soft)",
    fg: "var(--flow-amber)",
  },
  deal_followup: {
    icon: GitBranch,
    soft: "var(--flow-cyan-soft)",
    fg: "var(--flow-cyan)",
  },
  proposal_handoff: {
    icon: FileCheck,
    soft: "var(--flow-accent-soft)",
    fg: "var(--flow-accent)",
  },
};

export function WorkflowTemplatesGallery({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function install(templateId: string) {
    setBusyId(templateId);
    setError(null);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const data = (await res.json()) as {
        workflow?: { id: string };
        error?: string;
      };
      if (!res.ok || !data.workflow) {
        setError(typeof data.error === "string" ? data.error : "Install failed");
        return;
      }
      router.push(`/workflows/${data.workflow.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--flow-ink)" }}
        >
          Extra ideas
        </h3>
        <p className="mt-1 text-xs" style={{ color: "var(--flow-muted)" }}>
          Add one of these if the six above don’t cover it. You can change the wording after.
        </p>
      </div>
      {error && (
        <p className="text-xs" style={{ color: "var(--flow-danger)" }}>
          {error}
        </p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2">
        {templates.map((template) => {
          const visual =
            PLAYBOOK_VISUAL[template.templateId ?? ""] ??
            PLAYBOOK_VISUAL.hot_lead_chase!;
          const Icon = visual.icon;
          return (
            <li key={template.templateId ?? template.name}>
              <FlowPanel className="flex h-full flex-col !p-5">
                <div className="mb-3 flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: visual.soft, color: visual.fg }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="font-semibold"
                      style={{ color: "var(--flow-ink)" }}
                    >
                      {template.name}
                    </p>
                    {template.description ? (
                      <p
                        className="mt-1 text-xs leading-relaxed"
                        style={{ color: "var(--flow-muted)" }}
                      >
                        {template.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  <FlowChip tone="cyan">{template.trigger.label}</FlowChip>
                  <FlowChip tone="muted">{template.steps.length} steps</FlowChip>
                  {template.tags.map((tag) => (
                    <FlowChip key={tag} tone={tagTone(tag)}>
                      {tag}
                    </FlowChip>
                  ))}
                </div>
                <FlowPrimaryButton
                  type="button"
                  className="mt-auto w-full sm:w-auto"
                  disabled={busyId !== null}
                  onClick={() => void install(template.templateId ?? "")}
                >
                  {busyId === template.templateId
                    ? "Installing…"
                    : "Use this"}
                </FlowPrimaryButton>
              </FlowPanel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
