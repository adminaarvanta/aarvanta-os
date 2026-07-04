import { getBuddyById } from "@/lib/ageb/buddies";
import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import { dispatchBuddyToEngine, mergeFabricWithEngine } from "@/lib/fabric/dispatch";
import type { FabricTaskResult } from "@/lib/fabric/types";
import type { ActorRef } from "@/types/identity";
import type { TenantScope } from "@/types/communication";

export type { FabricTaskResult } from "@/lib/fabric/types";

export async function routeFabricTask(input: {
  scope: TenantScope;
  buddyId: string;
  task: string;
  actor: ActorRef;
  executeEngine?: boolean;
}): Promise<FabricTaskResult> {
  const buddy = getBuddyById(input.buddyId);
  const buddyName = buddy?.name ?? input.buddyId;

  const base = isAiConfigured()
    ? await routeWithAi(input.buddyId, buddyName, buddy, input.task)
    : heuristicResult(input.buddyId, buddyName, buddy, input.task);

  if (input.executeEngine !== false) {
    const engine = await dispatchBuddyToEngine({
      scope: input.scope,
      buddyId: input.buddyId,
      task: input.task,
    });
    return mergeFabricWithEngine(base, engine);
  }

  return base;
}

async function routeWithAi(
  buddyId: string,
  buddyName: string,
  buddy: ReturnType<typeof getBuddyById>,
  task: string
): Promise<FabricTaskResult> {
  try {
    const result = await completeJson<{
      recommendation: string;
      reasoning: string;
      confidence: number;
      riskLevel: "low" | "medium" | "high";
      suggestedActions: string[];
    }>({
      system: `You are the Aarvanta OS Intelligence Fabric routing to ${buddyName}.
Domain: ${buddy?.domain ?? "general"}. Tools: ${buddy?.tools.join(", ") ?? "none"}.
Respond with JSON: recommendation, reasoning, confidence (0-1), riskLevel, suggestedActions (array).`,
      user: `Task: ${task}`,
    });
    return {
      buddyId,
      buddyName,
      task,
      ...result,
      usedAi: true,
    };
  } catch {
    return heuristicResult(buddyId, buddyName, buddy, task);
  }
}

function heuristicResult(
  buddyId: string,
  buddyName: string,
  buddy: ReturnType<typeof getBuddyById>,
  task: string
): FabricTaskResult {
  return {
    buddyId,
    buddyName,
    task,
    recommendation: `${buddyName} recommends reviewing ${task} against current workspace data.`,
    reasoning: `Routed via Intelligence Fabric to ${buddy?.domain ?? "general"} domain.`,
    confidence: 0.72,
    riskLevel: "low",
    suggestedActions: [
      "Review related records in the dashboard",
      "Assign a follow-up task if action is needed",
    ],
    usedAi: false,
  };
}
