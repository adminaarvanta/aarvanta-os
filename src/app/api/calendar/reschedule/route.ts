import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { rescheduleMeeting } from "@/lib/calling/book-meeting";
import { getSessionContext } from "@/lib/tenant/context";

const schema = z.object({
  meetingId: z.string().min(1),
  meetingStart: z.string().min(1),
  meetingEnd: z.string().min(1),
  timezone: z.string().optional(),
});

export async function PATCH(req: Request) {
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
    const meeting = await rescheduleMeeting({
      scope: ctx.scope,
      ...parsed.data,
    });
    return NextResponse.json({ meeting });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reschedule failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
