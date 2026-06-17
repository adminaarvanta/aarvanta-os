import { completeText } from "@/lib/ai/provider";
import { isAiConfigured } from "@/lib/ai/config";
import { getAgentDefinition } from "@/lib/workforce/agents";
import type { WorkforceContext } from "@/lib/workforce/context";
import type { AgentMemoryEntry, AgentType } from "@/types/workforce";

function chatSystemPrompt(type: AgentType, memory: AgentMemoryEntry[]): string {
  const agent = getAgentDefinition(type);
  const memoryBlock =
    memory.length > 0
      ? `\n\nYour remembered context:\n${memory
          .slice(0, 12)
          .map((m) => `- [${m.category}] ${m.content}`)
          .join("\n")}`
      : "";

  return `You are ${agent.name} (${agent.title}) in Aarvanta OS — an AI Workforce & Business Operating System.
Your primary function: ${agent.primaryFunction}.
${agent.tagline}

Respond as a knowledgeable, concise business colleague. Use CRM and business context when provided.
When suggesting actions, be specific and actionable. Do not use JSON — respond in plain text.${memoryBlock}`;
}

function heuristicChatReply(
  type: AgentType,
  userMessage: string,
  context: WorkforceContext
): string {
  const agent = getAgentDefinition(type);
  const lower = userMessage.toLowerCase();

  if (lower.includes("pipeline") || lower.includes("deal")) {
    return `[Demo mode] ${agent.name}: You have ${context.business.openDealCount} open deals worth £${context.business.pipelineValue.toLocaleString()} with a weighted forecast of £${context.business.weightedForecast.toLocaleString()}. Set OPENAI_API_KEY for full AI chat.`;
  }
  if (lower.includes("lead") || lower.includes("hot")) {
    return `[Demo mode] ${agent.name}: ${context.business.hotLeadCount} hot leads identified. ${context.hotLeads.map((l) => l.name).join(", ") || "Run lead scoring on contacts to populate."}`;
  }
  if (lower.includes("task") || lower.includes("overdue")) {
    return `[Demo mode] ${agent.name}: ${context.business.openTaskCount} open tasks across the business. Review the Tasks tab for agent-assigned work.`;
  }

  return `[Demo mode] ${agent.name}: I received your message. Connect OPENAI_API_KEY for intelligent responses about your business. Your primary function is ${agent.primaryFunction}.`;
}

export async function executeAgentChat(input: {
  agentType: AgentType;
  userMessage: string;
  context: WorkforceContext;
  memory: AgentMemoryEntry[];
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<string> {
  const { agentType, userMessage, context, memory, history } = input;

  if (!isAiConfigured()) {
    return heuristicChatReply(agentType, userMessage, context);
  }

  const system = chatSystemPrompt(agentType, memory);
  const contextNote = JSON.stringify({ business: context.business, contact: context.contact });

  return completeText({
    system,
    messages: [
      ...history.slice(-10),
      {
        role: "user",
        content: `Business context:\n${contextNote}\n\nUser message:\n${userMessage}`,
      },
    ],
    temperature: 0.4,
  });
}
