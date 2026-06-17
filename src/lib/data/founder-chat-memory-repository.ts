import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { FounderChatRepository } from "@/lib/data/founder-chat-repository";
import type { TenantScope } from "@/types/communication";
import type { FounderChatMessage } from "@/types/founder";

let messages: FounderChatMessage[] = [];

export const founderChatMemoryRepository: FounderChatRepository = {
  async listMessages(scope, limit = 50) {
    return messages
      .filter((m) => inCrmScope(m, scope))
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .slice(-limit);
  },

  async addMessage(input, scope) {
    const message: FounderChatMessage = {
      ...scope,
      ...input,
      id: crmNewId("founder_chat"),
      createdAt: crmNow(),
    };
    messages.push(message);
    return message;
  },

  async clearMessages(scope) {
    messages = messages.filter((m) => !inCrmScope(m, scope));
  },
};

export function resetFounderChat() {
  messages = [];
}
