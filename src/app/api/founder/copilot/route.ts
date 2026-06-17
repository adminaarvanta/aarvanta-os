import { NextResponse } from "next/server";
import { z } from "zod";
import { getFounderChatRepository } from "@/lib/data/founder-chat-store";
import { buildFounderCopilotContext } from "@/lib/founder/build-snapshot";
import { askFounderCopilot, generateDailyBriefing } from "@/lib/founder/copilot";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const postSchema = z.object({
  message: z.string().min(1).max(4000).optional(),
  briefing: z.boolean().optional(),
});

export async function GET() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const messages = await getFounderChatRepository().listMessages(scope);
  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const chatRepo = getFounderChatRepository();
  const context = await buildFounderCopilotContext(scope);
  const history = await chatRepo.listMessages(scope, 20);

  if (parsed.data.briefing) {
    const briefing = await generateDailyBriefing(context);
    const message = await chatRepo.addMessage(
      { role: "assistant", content: briefing },
      scope
    );
    return NextResponse.json({ message, result: { answer: briefing, method: "rag" as const } });
  }

  if (!parsed.data.message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  await chatRepo.addMessage(
    { role: "user", content: parsed.data.message },
    scope
  );

  const result = await askFounderCopilot({
    question: parsed.data.message,
    context,
    history: history.map((m) => ({ role: m.role, content: m.content })),
  });

  const message = await chatRepo.addMessage(
    { role: "assistant", content: result.answer },
    scope
  );

  return NextResponse.json({ message, result });
}

export async function DELETE() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  await getFounderChatRepository().clearMessages(scope);
  return NextResponse.json({ ok: true });
}
