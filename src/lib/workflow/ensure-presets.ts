import {
  AUTOMATION_PRESETS,
  AUTOMATION_PRESET_IDS,
} from "@/lib/data/workflow-demo-seed";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import type { TenantScope } from "@/types/communication";
import type { Workflow } from "@/types/workflow";

export async function isAutomationPresetEnabled(
  scope: TenantScope,
  templateId: string
): Promise<boolean> {
  const workflows = await getWorkflowRepository().listWorkflows(scope);
  const match = workflows.find((workflow) => workflow.templateId === templateId);
  return match ? match.enabled : true;
}

/** Create any of the six Automation home presets that are missing for this workspace. */
export async function ensureAutomationPresets(
  scope: TenantScope
): Promise<Workflow[]> {
  const repo = getWorkflowRepository();
  const existing = await repo.listWorkflows(scope);
  const have = new Set(
    existing.map((workflow) => workflow.templateId).filter(Boolean)
  );

  for (const template of AUTOMATION_PRESETS) {
    if (!template.templateId || have.has(template.templateId)) continue;
    await repo.createWorkflow(
      {
        name: template.name,
        description: template.description,
        enabled: template.enabled,
        templateId: template.templateId,
        trigger: template.trigger,
        steps: template.steps.map((step, index) => ({
          ...step,
          id: `${step.id}_${Date.now()}_${index}`,
        })),
        tags: template.tags,
      },
      scope
    );
  }

  const refreshed = await repo.listWorkflows(scope);
  const order = new Map(
    AUTOMATION_PRESET_IDS.map((id, index) => [id, index] as const)
  );
  return [...refreshed].sort((a, b) => {
    const ai = a.templateId ? (order.get(a.templateId as (typeof AUTOMATION_PRESET_IDS)[number]) ?? 99) : 99;
    const bi = b.templateId ? (order.get(b.templateId as (typeof AUTOMATION_PRESET_IDS)[number]) ?? 99) : 99;
    if (ai !== bi) return ai - bi;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}
