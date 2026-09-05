import { NextResponse } from "next/server";
import { canAccessWhatsAppOs } from "@/lib/channels/whatsapp-access";
import { getRepository } from "@/lib/data/repository";
import { getSessionContext } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

export async function DELETE() {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }
  if (!canAccessWhatsAppOs(ctx.email)) {
    return NextResponse.json(
      { error: { message: "WhatsApp OS is not available for this account." } },
      { status: 403 }
    );
  }

  const result = await getRepository().clearWhatsAppHistory(ctx.scope);
  return NextResponse.json({ ok: true, ...result });
}
