import { deliverOutbound } from "@/lib/channels/deliver";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { applyAgentAction } from "@/lib/workforce/apply-action";
import { executeAgentRun } from "@/lib/workforce/run-agent";
import { buildWorkforceContext } from "@/lib/workforce/context";
import { crmNow } from "@/lib/data/crm-helpers";
import type { TenantScope } from "@/types/communication";
import type {
  ActionStepConfig,
  AgentStepConfig,
  ApprovalStepConfig,
  ConditionStepConfig,
  Workflow,
  WorkflowRun,
  WorkflowRunContext,
  WorkflowStepLog,
} from "@/types/workflow";
import type { AgentType } from "@/types/workforce";
import type { ContactTag } from "@/types/crm";
import { isAgentType } from "@/lib/workforce/agents";

function evaluateCondition(
  config: ConditionStepConfig,
  context: WorkflowRunContext
): boolean {
  const raw =
    config.field === "leadScore"
      ? context.leadScore ?? 0
      : context.dealValue ?? 0;

  switch (config.operator) {
    case "gte":
      return raw >= config.value;
    case "lte":
      return raw <= config.value;
    case "eq":
      return raw === config.value;
    default:
      return false;
  }
}

function fillTemplate(
  template: string,
  context: WorkflowRunContext
): string {
  return template
    .replace(/\{\{name\}\}/gi, context.contactName ?? "there")
    .replace(/\{\{score\}\}/gi, String(context.leadScore ?? ""))
    .replace(/\{\{dealValue\}\}/gi, String(context.dealValue ?? ""))
    .replace(/\{\{notes\}\}/gi, context.notes ?? "");
}

async function resolveContactPhoneEmail(
  scope: TenantScope,
  context: WorkflowRunContext
) {
  if (!context.contactId) return { phone: undefined, email: undefined, name: context.contactName };
  const contact = await getCrmRepository().getContact(context.contactId, scope);
  if (!contact) return { phone: undefined, email: undefined, name: context.contactName };
  return {
    phone: contact.phone,
    email: contact.email,
    name:
      `${contact.firstName} ${contact.lastName}`.trim() || context.contactName,
  };
}

async function executeActionStep(
  config: ActionStepConfig,
  scope: TenantScope,
  context: WorkflowRunContext
): Promise<{ output: string; contextPatch?: Partial<WorkflowRunContext> }> {
  const crm = getCrmRepository();
  const inbox = getRepository();

  if (config.actionType === "create_task") {
    const task = await crm.createTask(
      {
        title: config.title ?? "Workflow task",
        description: config.description,
        priority: config.priority ?? "medium",
        contactId: context.contactId,
        dealId: context.dealId,
        source: "ai",
      },
      scope
    );
    return { output: `Task created: ${task.title}` };
  }

  if (config.actionType === "create_activity") {
    const activity = await crm.createActivity(
      {
        type: config.activityType ?? "note",
        title: config.title ?? "Workflow activity",
        description: config.description,
        contactId: context.contactId,
        dealId: context.dealId,
        authorName: "BDM Workflow",
      },
      scope
    );
    return { output: `Activity logged: ${activity.title}` };
  }

  if (config.actionType === "alert") {
    const message = config.alertMessage ?? config.title ?? "Workflow alert";
    if (context.contactId) {
      await crm.createActivity(
        {
          type: "note",
          title: "Workflow alert",
          description: message,
          contactId: context.contactId,
          dealId: context.dealId,
          authorName: "BDM Workflow",
        },
        scope
      );
    }
    return { output: `Alert: ${message}` };
  }

  if (config.actionType === "tag_contact") {
    if (!context.contactId) throw new Error("tag_contact needs a contact on this run.");
    const contact = await crm.getContact(context.contactId, scope);
    if (!contact) throw new Error("Contact not found.");
    const tag = (config.tag ?? "follow_up") as ContactTag;
    const tags = contact.tags.includes(tag)
      ? contact.tags
      : [...contact.tags, tag];
    await crm.updateContact(context.contactId, { tags }, scope);
    return { output: `Tagged contact as ${tag}` };
  }

  if (config.actionType === "update_lead_score") {
    if (!context.contactId) {
      throw new Error("update_lead_score needs a contact on this run.");
    }
    const score = config.leadScore ?? 70;
    await crm.updateContact(
      context.contactId,
      {
        leadScore: score,
        leadScoreReason: config.description ?? "Updated by BDM workflow",
        leadScoreUpdatedAt: crmNow(),
      },
      scope
    );
    return {
      output: `Lead score set to ${score}`,
      contextPatch: { leadScore: score },
    };
  }

  if (config.actionType === "move_deal_stage") {
    if (!context.dealId) throw new Error("move_deal_stage needs a deal on this run.");
    const deal = await crm.getDeal(context.dealId, scope);
    if (!deal) throw new Error("Deal not found.");
    const pipeline = await crm.getPipeline(deal.pipelineId, scope);
    const stageName = config.stageName ?? "Proposal";
    const stage = pipeline?.stages.find(
      (s) => s.name.toLowerCase() === stageName.toLowerCase()
    );
    if (!stage) {
      const names = pipeline?.stages.map((s) => s.name).join(", ") ?? "none";
      throw new Error(`Stage "${stageName}" not found. Available: ${names}`);
    }
    await crm.updateDeal(
      context.dealId,
      { stageId: stage.id, probability: stage.probability },
      scope
    );
    return { output: `Deal moved to stage: ${stage.name}` };
  }

  if (config.actionType === "draft_outreach") {
    const template =
      config.messageTemplate ??
      "Hi {{name}}, thanks for your interest — happy to share how Aarvanta can help. Are you free for a quick call this week?";
    const body = fillTemplate(template, context);
    const subject =
      config.emailSubject ?? `Quick chat with ${context.contactName ?? "you"}`;
    if (context.contactId) {
      await crm.createActivity(
        {
          type: "note",
          title: "Outreach draft ready",
          description: body,
          contactId: context.contactId,
          dealId: context.dealId,
          authorName: "BDM Workflow",
        },
        scope
      );
    }
    return {
      output: `Draft saved (${body.slice(0, 80)}…)`,
      contextPatch: { draftMessage: body, draftSubject: subject },
    };
  }

  if (
    config.actionType === "send_whatsapp" ||
    config.actionType === "send_email"
  ) {
    const channel = config.actionType === "send_whatsapp" ? "whatsapp" : "email";
    const contactInfo = await resolveContactPhoneEmail(scope, context);
    const body = fillTemplate(
      config.messageTemplate ??
        context.draftMessage ??
        "Hi {{name}}, following up from Aarvanta — when works for a quick intro call?",
      context
    );
    const subject =
      config.emailSubject ??
      context.draftSubject ??
      "Following up from Aarvanta";

    if (channel === "whatsapp" && !contactInfo.phone) {
      throw new Error("Contact has no phone number for WhatsApp.");
    }
    if (channel === "email" && !contactInfo.email) {
      throw new Error("Contact has no email for outreach.");
    }

    let conversationId = context.contactId
      ? (await crm.getContact(context.contactId, scope))?.conversationIds?.[0]
      : undefined;

    if (channel === "whatsapp" && contactInfo.phone) {
      const conv = await inbox.ensurePhoneConversation(
        {
          phone: contactInfo.phone,
          contactName: contactInfo.name,
          channel: "whatsapp",
        },
        scope
      );
      conversationId = conv.id;
      await inbox.addMessage(
        conv.id,
        { channel: "whatsapp", content: body },
        scope,
        { name: "BDM Workflow" }
      );
    } else if (channel === "email" && contactInfo.email) {
      let conv = await inbox.findConversationByEmail(contactInfo.email, scope);
      if (!conv) {
        // Reuse phone ensure isn't right; create via inbound email helper path
        conv = await inbox.addInboundEmail(
          {
            email: contactInfo.email,
            contactName: contactInfo.name,
            subject: "Workflow thread",
            body: "(thread started by BDM workflow)",
          },
          scope
        );
      }
      conversationId = conv.id;
      await inbox.addOutboundEmail(
        conv.id,
        { subject, content: body },
        scope,
        { name: "BDM Workflow" }
      );
    }

    await deliverOutbound({
      channel,
      contact: {
        id: context.contactId ?? "contact_unknown",
        name: contactInfo.name ?? "Contact",
        phone: contactInfo.phone,
        email: contactInfo.email,
      },
      content: body,
      subject: channel === "email" ? subject : undefined,
      conversationId,
    });

    if (context.contactId) {
      await crm.createActivity(
        {
          type: channel === "whatsapp" ? "note" : "note",
          title: `Sent ${channel}`,
          description: body,
          contactId: context.contactId,
          dealId: context.dealId,
          authorName: "BDM Workflow",
        },
        scope
      );
    }

    return { output: `Sent ${channel} to ${contactInfo.name ?? "contact"}` };
  }

  if (config.actionType === "book_meeting") {
    const title =
      config.meetingTitle ?? config.title ?? "Discovery call";
    const notes =
      config.meetingNotes ??
      config.description ??
      "Booked via BDM workflow — confirm time with prospect.";
    if (context.contactId) {
      await crm.createActivity(
        {
          type: "meeting",
          title,
          description: notes,
          contactId: context.contactId,
          dealId: context.dealId,
          authorName: "BDM Workflow",
        },
        scope
      );
    }
    const task = await crm.createTask(
      {
        title: `Confirm meeting: ${title}`,
        description: notes,
        priority: "high",
        contactId: context.contactId,
        dealId: context.dealId,
        source: "ai",
      },
      scope
    );
    return { output: `Meeting logged + task: ${task.title}` };
  }

  return { output: config.alertMessage ?? "Action completed." };
}

async function executeAgentStep(
  config: AgentStepConfig,
  scope: TenantScope,
  context: WorkflowRunContext
): Promise<string> {
  if (!isAgentType(config.agentType)) {
    throw new Error(`Invalid agent type: ${config.agentType}`);
  }

  const agentType = config.agentType as AgentType;
  const workforceContext = await buildWorkforceContext(scope, {
    contactId: context.contactId,
  });

  const result = await executeAgentRun({ agentType, context: workforceContext });
  const apply = config.applyActions !== false;
  const applied: string[] = [];

  if (apply && result.actions?.length) {
    for (const action of result.actions.slice(0, 3)) {
      try {
        const payload = { ...action.payload };
        if (context.contactId && payload.contactId === undefined) {
          payload.contactId = context.contactId;
        }
        if (context.dealId && payload.dealId === undefined) {
          payload.dealId = context.dealId;
        }
        const out = await applyAgentAction(
          { ...action, payload },
          scope,
          { agentType }
        );
        applied.push(out.message);
      } catch {
        /* skip failed optional action */
      }
    }
  }

  const extras = applied.length ? ` Applied: ${applied.join("; ")}` : "";
  return `${result.summary}${extras}`;
}

export async function enrichRunContext(
  scope: TenantScope,
  context: WorkflowRunContext
): Promise<WorkflowRunContext> {
  const enriched = { ...context };
  const crm = getCrmRepository();

  if (context.contactId && enriched.leadScore === undefined) {
    const contact = await crm.getContact(context.contactId, scope);
    if (contact) {
      enriched.contactName = `${contact.firstName} ${contact.lastName}`.trim();
      enriched.leadScore = contact.leadScore;
    }
  }

  if (context.dealId && enriched.dealValue === undefined) {
    const deal = await crm.getDeal(context.dealId, scope);
    if (deal) enriched.dealValue = deal.value;
  }

  return enriched;
}

export async function executeWorkflowRun(
  workflow: Workflow,
  run: WorkflowRun,
  scope: TenantScope,
  startIndex = 0
): Promise<WorkflowRun> {
  const repo = getWorkflowRepository();
  let context = await enrichRunContext(scope, run.context);
  const logs: WorkflowStepLog[] = [...run.stepLogs];

  for (let i = startIndex; i < workflow.steps.length; i += 1) {
    const step = workflow.steps[i]!;
    const at = crmNow();

    try {
      if (step.type === "condition") {
        const config = step.config as unknown as ConditionStepConfig;
        const pass = evaluateCondition(config, context);
        logs.push({
          stepId: step.id,
          stepLabel: step.label,
          stepType: step.type,
          status: pass ? "completed" : "skipped",
          output: pass
            ? "Condition met — continuing."
            : "Condition not met — stopping this run.",
          at,
        });

        if (!pass) {
          return (
            (await repo.updateRun(
              run.id,
              {
                status: "completed",
                stepLogs: logs,
                context,
                completedAt: crmNow(),
                pendingApproval: undefined,
              },
              scope
            )) ?? run
          );
        }
        continue;
      }

      if (step.type === "delay") {
        logs.push({
          stepId: step.id,
          stepLabel: step.label,
          stepType: step.type,
          status: "completed",
          output:
            "Wait noted (runs continue immediately in this version — use a follow-up task for real timing).",
          at,
        });
        continue;
      }

      if (step.type === "agent") {
        const output = await executeAgentStep(
          step.config as unknown as AgentStepConfig,
          scope,
          context
        );
        logs.push({
          stepId: step.id,
          stepLabel: step.label,
          stepType: step.type,
          status: "completed",
          output,
          at,
        });
        continue;
      }

      if (step.type === "approval") {
        const config = step.config as unknown as ApprovalStepConfig;
        logs.push({
          stepId: step.id,
          stepLabel: step.label,
          stepType: step.type,
          status: "pending",
          output: "Awaiting human approval.",
          at,
        });

        return (
          (await repo.updateRun(
            run.id,
            {
              status: "awaiting_approval",
              stepLogs: logs,
              context,
              pendingApproval: {
                stepId: step.id,
                stepLabel: step.label,
                message: config.message,
              },
            },
            scope
          )) ?? run
        );
      }

      if (step.type === "action") {
        const result = await executeActionStep(
          step.config as unknown as ActionStepConfig,
          scope,
          context
        );
        if (result.contextPatch) {
          context = { ...context, ...result.contextPatch };
        }
        logs.push({
          stepId: step.id,
          stepLabel: step.label,
          stepType: step.type,
          status: "completed",
          output: result.output,
          at,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Step failed";
      logs.push({
        stepId: step.id,
        stepLabel: step.label,
        stepType: step.type,
        status: "failed",
        output: message,
        at,
      });

      return (
        (await repo.updateRun(
          run.id,
          {
            status: "failed",
            stepLogs: logs,
            error: message,
            context,
            completedAt: crmNow(),
          },
          scope
        )) ?? run
      );
    }
  }

  return (
    (await repo.updateRun(
      run.id,
      {
        status: "completed",
        stepLogs: logs,
        context,
        completedAt: crmNow(),
        pendingApproval: undefined,
      },
      scope
    )) ?? run
  );
}

export async function startWorkflowRun(
  scope: TenantScope,
  workflow: Workflow,
  context: WorkflowRunContext = {},
  options?: { trigger?: "manual" | "automation" }
): Promise<WorkflowRun> {
  const repo = getWorkflowRepository();
  const enriched = await enrichRunContext(scope, context);

  const run = await repo.createRun(
    {
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: "running",
      trigger: options?.trigger ?? "manual",
      context: enriched,
      stepLogs: [],
    },
    scope
  );

  return executeWorkflowRun(workflow, run, scope);
}

export async function approveWorkflowRun(
  scope: TenantScope,
  runId: string
): Promise<WorkflowRun | null> {
  const repo = getWorkflowRepository();
  const run = await repo.getRun(runId, scope);
  if (!run || run.status !== "awaiting_approval" || !run.pendingApproval) {
    return null;
  }

  const workflow = await repo.getWorkflow(run.workflowId, scope);
  if (!workflow) return null;

  const approvalIndex = workflow.steps.findIndex(
    (s) => s.id === run.pendingApproval!.stepId
  );
  if (approvalIndex === -1) return null;

  const logs = run.stepLogs.map((log) =>
    log.stepId === run.pendingApproval!.stepId && log.status === "pending"
      ? {
          ...log,
          status: "completed" as const,
          output: "Approved by user.",
          at: crmNow(),
        }
      : log
  );

  const resumed: WorkflowRun = {
    ...run,
    status: "running",
    stepLogs: logs,
    pendingApproval: undefined,
  };

  await repo.updateRun(
    runId,
    {
      status: "running",
      stepLogs: logs,
      pendingApproval: undefined,
    },
    scope
  );

  return executeWorkflowRun(workflow, resumed, scope, approvalIndex + 1);
}

export function defaultDemoContext(templateId?: string): WorkflowRunContext {
  if (
    templateId === "hot_lead_chase" ||
    templateId === "deal_followup" ||
    templateId === "proposal_handoff" ||
    templateId === "proposal_approval"
  ) {
    return {
      contactId: "contact_sarah",
      dealId: "deal_meridian",
      contactName: "Sarah Chen",
      leadScore: 82,
      dealValue: 48000,
    };
  }
  return {
    contactId: "contact_sarah",
    contactName: "Sarah Chen",
    leadScore: 82,
  };
}
