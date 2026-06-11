import { getCrmRepository } from "@/lib/data/crm-store";
import type { TenantScope } from "@/types/communication";
import type { AgentAction } from "@/types/workforce";

export async function applyAgentAction(
  action: AgentAction,
  scope: TenantScope
): Promise<{ kind: string; id?: string; message: string }> {
  const crm = getCrmRepository();

  switch (action.type) {
    case "create_task": {
      const p = action.payload as {
        title?: string;
        description?: string;
        priority?: "low" | "medium" | "high";
        dueDate?: string;
        contactId?: string;
        accountId?: string;
        dealId?: string;
      };
      if (!p.title) throw new Error("Task title is required.");
      const task = await crm.createTask(
        {
          title: p.title,
          description: p.description,
          priority: p.priority ?? "medium",
          dueDate: p.dueDate,
          contactId: p.contactId,
          accountId: p.accountId,
          dealId: p.dealId,
          source: "ai",
        },
        scope
      );
      return { kind: "task", id: task.id, message: `Task created: ${task.title}` };
    }
    case "create_activity": {
      const p = action.payload as {
        type?: "call" | "meeting" | "note";
        title?: string;
        description?: string;
        contactId?: string;
        accountId?: string;
        dealId?: string;
      };
      if (!p.title || !p.type) throw new Error("Activity type and title are required.");
      const activity = await crm.createActivity(
        {
          type: p.type,
          title: p.title,
          description: p.description,
          contactId: p.contactId,
          accountId: p.accountId,
          dealId: p.dealId,
          authorName: "AI Workforce",
        },
        scope
      );
      return {
        kind: "activity",
        id: activity.id,
        message: `Activity logged: ${activity.title}`,
      };
    }
    case "suggest_reply":
      return {
        kind: "suggest_reply",
        message:
          (action.payload.content as string) ||
          "Draft reply available — copy from run details.",
      };
    case "alert":
      return {
        kind: "alert",
        message: (action.payload.message as string) || action.label,
      };
    default:
      throw new Error(`Unsupported action type: ${action.type}`);
  }
}
