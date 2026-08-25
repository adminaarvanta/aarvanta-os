import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { canAccessWhatsAppOs } from "@/lib/channels/whatsapp-access";
import { getRepository } from "@/lib/data/repository";
import { getSessionContext } from "@/lib/tenant/context";

const schema = z.object({
  phone: z.string().min(5).max(32),
  contactName: z.string().max(120).optional(),
  channel: z.enum(["whatsapp", "voice"]),
});

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }
  const scope = ctx.scope;

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (
    parsed.data.channel === "whatsapp" &&
    !canAccessWhatsAppOs(ctx.email)
  ) {
    return NextResponse.json(
      { error: { message: "WhatsApp OS is not available for this account." } },
      { status: 403 }
    );
  }

  const phone = parsed.data.phone.trim();
  if (!/^\+?[\d\s()-]{5,}$/.test(phone)) {
    return NextResponse.json(
      { error: "Enter a valid phone number (include country code)." },
      { status: 400 }
    );
  }

  const conversation = await getRepository().ensurePhoneConversation(
    {
      phone,
      contactName: parsed.data.contactName?.trim() || undefined,
      channel: parsed.data.channel,
    },
    scope
  );

  return NextResponse.json({ conversation });
}
