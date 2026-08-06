import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { bookMeeting } from "@/lib/calling/book-meeting";
import { getSessionContext } from "@/lib/tenant/context";

const schema = z.object({
  leadId: z.string().min(1),
  meetingStart: z.string().min(1),
  meetingEnd: z.string().min(1),
  timezone: z.string().default("America/New_York"),
  campaignId: z.string().optional(),
  sessionId: z.string().optional(),
  salesRepName: z.string().optional(),
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
    const meeting = await bookMeeting({
      scope: ctx.scope,
      ...parsed.data,
      ownerId: ctx.userId,
      salesRepName: parsed.data.salesRepName ?? ctx.name,
    });
    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
