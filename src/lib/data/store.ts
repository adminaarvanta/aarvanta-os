import { DEMO_CONVERSATIONS } from "@/lib/data/demo-seed";
import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import type {
  Conversation,
  ConversationTag,
  CreateMessageInput,
  CreateNoteInput,
  TenantScope,
  TimelineMessage,
  TimelineNote,
} from "@/types/communication";

let conversations: Conversation[] = structuredClone(DEMO_CONVERSATIONS);

function inScope(c: Conversation, scope: TenantScope) {
  return (
    c.tenantId === scope.tenantId &&
    c.workspaceId === scope.workspaceId &&
    c.companyId === scope.companyId
  );
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export async function listConversations(
  scope: TenantScope = DEMO_TENANT
): Promise<Conversation[]> {
  return conversations
    .filter((c) => inScope(c, scope))
    .sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() -
        new Date(a.lastActivityAt).getTime()
    );
}

export async function getConversation(
  id: string,
  scope: TenantScope = DEMO_TENANT
): Promise<Conversation | null> {
  const found = conversations.find((c) => c.id === id && inScope(c, scope));
  return found ? structuredClone(found) : null;
}

export async function addMessage(
  conversationId: string,
  input: CreateMessageInput,
  scope: TenantScope = DEMO_TENANT
): Promise<Conversation | null> {
  const idx = conversations.findIndex(
    (c) => c.id === conversationId && inScope(c, scope)
  );
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const message: TimelineMessage = {
    id: newId("evt"),
    type: "message",
    direction: "outbound",
    channel: input.channel,
    content: input.content,
    occurredAt: now,
    authorName: "You",
  };

  const conv = conversations[idx];
  if (!conv.channels.includes(input.channel)) {
    conv.channels = [...conv.channels, input.channel];
  }
  conv.timeline.push(message);
  conv.lastActivityAt = now;
  conv.updatedAt = now;
  conv.unreadCount = 0;

  return structuredClone(conv);
}

export async function addInternalNote(
  conversationId: string,
  input: CreateNoteInput,
  scope: TenantScope = DEMO_TENANT
): Promise<Conversation | null> {
  const idx = conversations.findIndex(
    (c) => c.id === conversationId && inScope(c, scope)
  );
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const note: TimelineNote = {
    id: newId("evt"),
    type: "note",
    content: input.content,
    isInternal: true,
    occurredAt: now,
    authorName: "You",
  };

  const conv = conversations[idx];
  conv.timeline.push(note);
  conv.lastActivityAt = now;
  conv.updatedAt = now;

  return structuredClone(conv);
}

export async function setTags(
  conversationId: string,
  tags: ConversationTag[],
  scope: TenantScope = DEMO_TENANT
): Promise<Conversation | null> {
  const idx = conversations.findIndex(
    (c) => c.id === conversationId && inScope(c, scope)
  );
  if (idx === -1) return null;

  conversations[idx].tags = tags;
  conversations[idx].updatedAt = new Date().toISOString();
  return structuredClone(conversations[idx]);
}

export async function updateAiInsights(
  conversationId: string,
  data: { aiSummary: string; sentiment: Conversation["sentiment"] },
  scope: TenantScope = DEMO_TENANT
): Promise<Conversation | null> {
  const idx = conversations.findIndex(
    (c) => c.id === conversationId && inScope(c, scope)
  );
  if (idx === -1) return null;

  const now = new Date().toISOString();
  conversations[idx].aiSummary = data.aiSummary;
  conversations[idx].sentiment = data.sentiment;
  conversations[idx].aiSummaryUpdatedAt = now;
  conversations[idx].updatedAt = now;

  return structuredClone(conversations[idx]);
}

export function resetDemoData() {
  conversations = structuredClone(DEMO_CONVERSATIONS);
}
