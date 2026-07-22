import { NextResponse } from "next/server";
import { z } from "zod";
import { deliverOutbound } from "@/lib/channels/deliver";
import { getRepository } from "@/lib/data/repository";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getSessionContext } from "@/lib/tenant/context";

const schema = z.object({
  phone: z.string().min(5),
  contactName: z.string().optional(),
  message: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const repo = getRepository();
  const scope = ctx.scope;
  let conversation = await repo.findConversationByPhone(parsed.data.phone, scope);

  if (!conversation) {
    conversation = await repo.addInboundCall(
      {
        phone: parsed.data.phone,
        contactName: parsed.data.contactName ?? parsed.data.phone,
        durationSeconds: 0,
        summary: "Outbound call initiated",
      },
      scope
    );
  }

  // Ensure contact name if provided
  const contact = {
    ...conversation.contact,
    phone: conversation.contact.phone ?? parsed.data.phone,
  };

  try {
    await deliverOutbound({
      channel: "voice",
      contact,
      content: parsed.data.message,
      conversationId: conversation.id,
      voiceDirection: "outbound",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Twilio voice delivery failed",
      },
      { status: 502 }
    );
  }

  const updated = await repo.addOutboundCall(
    conversation.id,
    { summary: parsed.data.message },
    scope,
    { name: ctx.name || "You", id: ctx.userId }
  );

  return NextResponse.json({
    conversationId: conversation.id,
    conversation: updated,
  });
}
