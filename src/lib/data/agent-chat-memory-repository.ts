import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { AgentChatRepository } from "@/lib/data/agent-chat-repository";
import type { TenantScope } from "@/types/communication";
import type { AgentChatMessage } from "@/types/workforce";

let messages: AgentChatMessage[] = [];

export const agentChatMemoryRepository: AgentChatRepository = {
  async listMessages(scope, agentType, limit = 100) {
    return messages
      .filter((m) => inCrmScope(m, scope) && m.agentType === agentType)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .slice(-limit);
  },

  async addMessage(input, scope) {
    const message: AgentChatMessage = {
      ...scope,
      ...input,
      id: crmNewId("agent_chat"),
      createdAt: crmNow(),
    };
    messages.push(message);
    return message;
  },

  async clearMessages(scope, agentType) {
    messages = messages.filter(
      (m) => !(inCrmScope(m, scope) && m.agentType === agentType)
    );
  },
};

export function resetAgentChat() {
  messages = [];
}
