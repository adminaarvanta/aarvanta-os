import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data/repository";
import { getWebhookTenantScope } from "@/lib/tenant/context";
import { parseJsonBody } from "@/lib/api/request";
import type { TimelineMessage } from "@/types/communication";

const postSchema = z.object({
  sessionId: z.string().min(1),
  content: z.string().min(1),
  visitorName: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const scope = getWebhookTenantScope();
  const conversation = await getRepository().addInboundChat(
    {
      sessionId: parsed.data.sessionId,
      visitorName: parsed.data.visitorName,
      content: parsed.data.content,
    },
    scope
  );

  return NextResponse.json({ ok: true, conversationId: conversation.id });
}

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const scope = getWebhookTenantScope();
  const conversation = await getRepository().findConversationByChatSession(
    sessionId,
    scope
  );

  if (!conversation) {
    return NextResponse.json({ messages: [] });
  }

  const messages = conversation.timeline
    .filter(
      (e): e is TimelineMessage =>
        e.type === "message" && e.channel === "website_chat"
    )
    .map((m) => ({
      id: m.id,
      direction: m.direction,
      content: m.content,
      occurredAt: m.occurredAt,
      authorName: m.authorName,
    }));

  return NextResponse.json({ messages, conversationId: conversation.id });
}
