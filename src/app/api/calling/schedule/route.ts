import { NextResponse } from "next/server";
import { z } from "zod";
import { listScheduledCalls } from "@/lib/calling/scheduled-call-store";
import { scheduleVoiceFollowUp } from "@/lib/calling/schedule-voice-follow-up";
import { parseJsonBody, sessionErrorResponse } from "@/lib/api/request";
import { getSessionContextFromRequest } from "@/lib/tenant/context";

export const runtime = "nodejs";

const schema = z.object({
  phone: z.string().min(5),
  contactName: z.string().optional(),
  contactId: z.string().optional(),
  message: z.string().min(1).max(2000),
  scheduledAt: z.string().min(1),
  voiceAgentId: z.string().optional(),
});

export async function GET(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContextFromRequest(req);
  } catch (error) {
    return sessionErrorResponse(error, "[calling/schedule] session");
  }

  const calls = await listScheduledCalls(ctx.scope);
  return NextResponse.json({
    calls: calls.filter((c) => c.status === "scheduled" || c.status === "calling"),
  });
}

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContextFromRequest(req);
  } catch (error) {
    return sessionErrorResponse(error, "[calling/schedule] session");
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { call, task } = await scheduleVoiceFollowUp(
      {
        phone: parsed.data.phone,
        contactName: parsed.data.contactName,
        contactId: parsed.data.contactId,
        message: parsed.data.message,
        scheduledAt: parsed.data.scheduledAt,
        voiceAgentId: parsed.data.voiceAgentId,
        kind: "scheduled",
      },
      ctx.scope
    );
    return NextResponse.json({ call, task }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not schedule call";
    const status = message.includes("1 minute") || message.includes("Invalid") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
