"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  Bot,
  Clock,
  GitBranch,
  Plus,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AGENT_DEFINITIONS } from "@/lib/workforce/agents";
import type {
  Workflow,
  WorkflowActionType,
  WorkflowStep,
  WorkflowStepType,
  WorkflowTriggerType,
} from "@/types/workflow";
import { WORKFLOW_ACTION_LABELS } from "@/types/workflow";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold";

const TRIGGER_OPTIONS: Array<{ type: WorkflowTriggerType; label: string }> = [
  { type: "manual", label: "I run it (pick a contact/deal)" },
  { type: "crm_lead_scored", label: "When a lead is scored" },
  { type: "deal_updated", label: "When a deal is updated" },
];

const STEP_TYPES: Array<{ type: WorkflowStepType; label: string }> = [
  { type: "condition", label: "Only if…" },
  { type: "agent", label: "AI Sales assist" },
  { type: "action", label: "Do something" },
  { type: "approval", label: "Ask me to approve" },
  { type: "delay", label: "Wait (noted)" },
];

const ACTION_OPTIONS = Object.entries(WORKFLOW_ACTION_LABELS) as Array<
  [WorkflowActionType, string]
>;

const stepIcons: Record<WorkflowStepType, typeof Zap> = {
  condition: GitBranch,
  agent: Bot,
  approval: ShieldCheck,
  action: Zap,
  delay: Clock,
};

function defaultConfig(type: WorkflowStepType): Record<string, unknown> {
  switch (type) {
    case "condition":
      return { field: "leadScore", operator: "gte", value: 70 };
    case "agent":
      return { agentType: "sales_manager", applyActions: true };
    case "approval":
      return { message: "Approve to continue this BDM play." };
    case "action":
      return {
        actionType: "create_task",
        title: "Follow up prospect",
        priority: "high",
      };
    case "delay":
      return { label: "Wait", minutes: 60 };
  }
}

export function WorkflowEditor({ workflow }: { workflow: Workflow }) {
  const router = useRouter();
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description ?? "");
  const [triggerType, setTriggerType] = useState(workflow.trigger.type);
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow.steps);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    workflow.steps[0]?.id ?? null
  );

  const selected = useMemo(
    () => steps.find((s) => s.id === selectedStepId) ?? null,
    [steps, selectedStepId]
  );

  function updateStep(id: string, patch: Partial<WorkflowStep>) {
    setSteps((current) =>
      current.map((step) => (step.id === id ? { ...step, ...patch } : step))
    );
  }

  function addStep(type: WorkflowStepType) {
    const id = `step_${crypto.randomUUID()}`;
    const meta = STEP_TYPES.find((s) => s.type === type)!;
    const step: WorkflowStep = {
      id,
      type,
      label: meta.label,
      config: defaultConfig(type),
    };
    setSteps((current) => [...current, step]);
    setSelectedStepId(id);
  }

  function removeStep(id: string) {
    setSteps((current) => current.filter((s) => s.id !== id));
    if (selectedStepId === id) setSelectedStepId(null);
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const trigger =
        TRIGGER_OPTIONS.find((t) => t.type === triggerType) ??
        TRIGGER_OPTIONS[0]!;
      const res = await fetch(`/api/workflows/${workflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          trigger: { type: trigger.type, label: trigger.label },
          steps,
        }),
      });
      if (!res.ok) {
        setMessage("Save failed");
        return;
      }
      setMessage("Saved");
      router.refresh();
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  const actionType = String(selected?.config.actionType ?? "create_task");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4 rounded-xl border border-border bg-surface-elevated p-5">
        <p className="text-xs text-muted">
          Build a simple BDM playbook: trigger → checks → outreach / CRM work →
          optional approval.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Playbook name"
          />
          <select
            className={inputClass}
            value={
              TRIGGER_OPTIONS.some((t) => t.type === triggerType)
                ? triggerType
                : "manual"
            }
            onChange={(e) =>
              setTriggerType(e.target.value as WorkflowTriggerType)
            }
          >
            {TRIGGER_OPTIONS.map((opt) => (
              <option key={opt.type} value={opt.type}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className={inputClass}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What should this BDM play achieve?"
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-full max-w-lg rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-center text-sm text-gold-bright">
            {TRIGGER_OPTIONS.find((t) => t.type === triggerType)?.label ??
              "Manual run"}
          </div>

          {steps.map((step) => {
            const Icon = stepIcons[step.type];
            const active = step.id === selectedStepId;
            return (
              <div
                key={step.id}
                className="flex w-full max-w-lg flex-col items-center gap-2"
              >
                <ArrowDown className="h-4 w-4 text-border" aria-hidden />
                <button
                  type="button"
                  onClick={() => setSelectedStepId(step.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-4 py-3 text-left transition-colors",
                    active
                      ? "border-gold bg-gold/10"
                      : "border-border bg-surface-muted hover:border-gold/40"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-gold" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted">
                      {step.type}
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {step.label}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded p-1 text-muted hover:text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStep(step.id);
                    }}
                    aria-label="Remove step"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {STEP_TYPES.map((opt) => (
            <Button
              key={opt.type}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => addStep(opt.type)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              {opt.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => void save()}
          >
            {busy ? "Saving…" : "Save playbook"}
          </Button>
          {message && <p className="text-xs text-muted">{message}</p>}
        </div>
      </div>

      <aside className="space-y-3 rounded-xl border border-border bg-surface-elevated p-5">
        <h3 className="text-sm font-semibold text-foreground">Step settings</h3>
        {!selected ? (
          <p className="text-xs text-muted">Select a step to configure it.</p>
        ) : (
          <>
            <input
              className={inputClass}
              value={selected.label}
              onChange={(e) =>
                updateStep(selected.id, { label: e.target.value })
              }
              placeholder="Step label"
            />

            {selected.type === "condition" && (
              <div className="space-y-2">
                <select
                  className={inputClass}
                  value={String(selected.config.field ?? "leadScore")}
                  onChange={(e) =>
                    updateStep(selected.id, {
                      config: { ...selected.config, field: e.target.value },
                    })
                  }
                >
                  <option value="leadScore">Lead score</option>
                  <option value="dealValue">Deal value</option>
                </select>
                <select
                  className={inputClass}
                  value={String(selected.config.operator ?? "gte")}
                  onChange={(e) =>
                    updateStep(selected.id, {
                      config: { ...selected.config, operator: e.target.value },
                    })
                  }
                >
                  <option value="gte">≥ greater or equal</option>
                  <option value="lte">≤ less or equal</option>
                  <option value="eq">= equal</option>
                </select>
                <input
                  type="number"
                  className={inputClass}
                  value={Number(selected.config.value ?? 0)}
                  onChange={(e) =>
                    updateStep(selected.id, {
                      config: {
                        ...selected.config,
                        value: Number(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            )}

            {selected.type === "agent" && (
              <select
                className={inputClass}
                value={String(selected.config.agentType ?? "sales_manager")}
                onChange={(e) =>
                  updateStep(selected.id, {
                    config: {
                      ...selected.config,
                      agentType: e.target.value,
                      applyActions: true,
                    },
                  })
                }
              >
                {AGENT_DEFINITIONS.map((agent) => (
                  <option key={agent.type} value={agent.type}>
                    {agent.name}
                  </option>
                ))}
              </select>
            )}

            {selected.type === "approval" && (
              <textarea
                className={inputClass}
                rows={3}
                value={String(selected.config.message ?? "")}
                onChange={(e) =>
                  updateStep(selected.id, {
                    config: { ...selected.config, message: e.target.value },
                  })
                }
              />
            )}

            {selected.type === "action" && (
              <div className="space-y-2">
                <select
                  className={inputClass}
                  value={actionType}
                  onChange={(e) =>
                    updateStep(selected.id, {
                      config: {
                        ...selected.config,
                        actionType: e.target.value,
                      },
                    })
                  }
                >
                  {ACTION_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                {(actionType === "create_task" ||
                  actionType === "create_activity" ||
                  actionType === "alert" ||
                  actionType === "book_meeting") && (
                  <input
                    className={inputClass}
                    placeholder="Title / message"
                    value={String(
                      selected.config.title ??
                        selected.config.meetingTitle ??
                        selected.config.alertMessage ??
                        ""
                    )}
                    onChange={(e) =>
                      updateStep(selected.id, {
                        config: {
                          ...selected.config,
                          title: e.target.value,
                          meetingTitle: e.target.value,
                          alertMessage: e.target.value,
                        },
                      })
                    }
                  />
                )}

                {actionType === "tag_contact" && (
                  <select
                    className={inputClass}
                    value={String(selected.config.tag ?? "follow_up")}
                    onChange={(e) =>
                      updateStep(selected.id, {
                        config: { ...selected.config, tag: e.target.value },
                      })
                    }
                  >
                    <option value="hot_lead">hot_lead</option>
                    <option value="prospect">prospect</option>
                    <option value="follow_up">follow_up</option>
                    <option value="vip">vip</option>
                    <option value="customer">customer</option>
                    <option value="partner">partner</option>
                  </select>
                )}

                {actionType === "update_lead_score" && (
                  <input
                    type="number"
                    className={inputClass}
                    value={Number(selected.config.leadScore ?? 70)}
                    onChange={(e) =>
                      updateStep(selected.id, {
                        config: {
                          ...selected.config,
                          leadScore: Number(e.target.value) || 0,
                        },
                      })
                    }
                  />
                )}

                {actionType === "move_deal_stage" && (
                  <input
                    className={inputClass}
                    placeholder="Stage name (e.g. Proposal)"
                    value={String(selected.config.stageName ?? "Proposal")}
                    onChange={(e) =>
                      updateStep(selected.id, {
                        config: {
                          ...selected.config,
                          stageName: e.target.value,
                        },
                      })
                    }
                  />
                )}

                {(actionType === "send_whatsapp" ||
                  actionType === "send_email" ||
                  actionType === "draft_outreach") && (
                  <>
                    {actionType === "send_email" ? (
                      <input
                        className={inputClass}
                        placeholder="Email subject"
                        value={String(selected.config.emailSubject ?? "")}
                        onChange={(e) =>
                          updateStep(selected.id, {
                            config: {
                              ...selected.config,
                              emailSubject: e.target.value,
                            },
                          })
                        }
                      />
                    ) : null}
                    <textarea
                      className={inputClass}
                      rows={4}
                      placeholder="Message — use {{name}}, {{score}}"
                      value={String(selected.config.messageTemplate ?? "")}
                      onChange={(e) =>
                        updateStep(selected.id, {
                          config: {
                            ...selected.config,
                            messageTemplate: e.target.value,
                          },
                        })
                      }
                    />
                  </>
                )}
              </div>
            )}

            {selected.type === "delay" && (
              <p className="text-xs text-muted">
                Delays are noted in the run log; create a follow-up task for real
                timing until scheduled waits ship.
              </p>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
