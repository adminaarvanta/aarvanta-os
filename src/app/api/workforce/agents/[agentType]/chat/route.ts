import { NextResponse } from "next/server";
import { z } from "zod";
import { AiNotConfiguredError, AiRequestError } from "@/lib/ai/provider";
import { getAgentChatRepository } from "@/lib/data/agent-chat-store";
import { getAgentMemoryRepository } from "@/lib/data/agent-memory-store";
import { isAgentType } from "@/lib/workforce/agents";
import { executeAgentChat } from "@/lib/workforce/agent-chat";
import { buildWorkforceContext } from "@/lib/workforce/context";
import { saveChatInsightToMemory } from "@/lib/workforce/save-run-memory";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const postSchema = z.object({
  message: z.string().min(1).max(4000),
  contactId: z.string().optional(),
  conversationId: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { agentType } = await params;
  if (!isAgentType(agentType)) {
    return NextResponse.json({ error: "Invalid agent type" }, { status: 400 });
  }

  const messages = await getAgentChatRepository().listMessages(scope, agentType);
  return NextResponse.json({ messages });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { agentType } = await params;
  if (!isAgentType(agentType)) {
    return NextResponse.json({ error: "Invalid agent type" }, { status: 400 });
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const chatRepo = getAgentChatRepository();
  const memoryRepo = getAgentMemoryRepository();

  await chatRepo.addMessage(
    { agentType, role: "user", content: parsed.data.message },
    scope
  );

  try {
    const [context, memory, history] = await Promise.all([
      buildWorkforceContext(scope, {
        contactId: parsed.data.contactId,
        conversationId: parsed.data.conversationId,
      }),
      memoryRepo.listMemory(scope, agentType, 15),
      chatRepo.listMessages(scope, agentType, 20),
    ]);

    const reply = await executeAgentChat({
      agentType,
      userMessage: parsed.data.message,
      context,
      memory,
      history: history.map((m) => ({ role: m.role, content: m.content })),
    });

    const assistantMessage = await chatRepo.addMessage(
      { agentType, role: "assistant", content: reply },
      scope
    );

    if (reply.length >= 80) {
      await saveChatInsightToMemory(agentType, reply, scope);
    }

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    const message =
      error instanceof AiNotConfiguredError ||
      error instanceof AiRequestError ||
      error instanceof Error
        ? error.message
        : "Chat failed";

    const status =
      error instanceof AiNotConfiguredError ? 503 : error instanceof AiRequestError ? 502 : 500;

    return NextResponse.json({ error: { code: "CHAT_FAILED", message } }, { status });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { agentType } = await params;
  if (!isAgentType(agentType)) {
    return NextResponse.json({ error: "Invalid agent type" }, { status: 400 });
  }

  await getAgentChatRepository().clearMessages(scope, agentType);
  return NextResponse.json({ ok: true });
}
