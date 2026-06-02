import { NextResponse } from "next/server";
import { z } from "zod";
import { deliverOutboundMessage } from "@/lib/channels/outbound";
import { getRepository } from "@/lib/data/repository";
import { getTenantScope } from "@/lib/tenant/context";
import { getSessionFromCookies } from "@/lib/auth/session";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const schema = z.object({
  content: z.string().min(1),
  channel: z.enum(["whatsapp", "email", "voice", "sms", "website_chat"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await getSessionFromCookies();
  const { id } = await params;
  const repo = getRepository();

  const existing = await repo.getConversation(id, scope);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const conversation = await repo.addMessage(
    id,
    parsed.data,
    scope,
    session ? { name: session.name, id: session.email } : undefined
  );
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await deliverOutboundMessage(
      parsed.data.channel,
      existing.contact.phone,
      parsed.data.content
    );
  } catch (error) {
    return NextResponse.json(
      {
        conversation,
        warning: {
          code: "DELIVERY_FAILED",
          message:
            error instanceof Error ? error.message : "Outbound delivery failed",
        },
      },
      { status: 202 }
    );
  }

  return NextResponse.json({ conversation });
}
