import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { dialQueueItemNow } from "@/lib/calling/campaign-scheduler";
import { getSessionContext } from "@/lib/tenant/context";

const schema = z.object({
  queueId: z.string().min(1),
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

  try {
    const result = await dialQueueItemNow(parsed.data.queueId, ctx.scope);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Call failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
