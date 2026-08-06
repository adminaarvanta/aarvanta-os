import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api/request";
import { bookMeeting } from "@/lib/calling/book-meeting";
import { getWebhookTenantScope } from "@/lib/tenant/context";

/**
 * Voice relay tool: book a meeting mid-call.
 * Auth: X-Voice-Relay-Secret === VOICE_RELAY_CALLBACK_SECRET
 */
const schema = z.object({
  leadId: z.string().min(1),
  meetingStart: z.string().min(1),
  meetingEnd: z.string().min(1),
  timezone: z.string().default("America/New_York"),
  campaignId: z.string().optional(),
  sessionId: z.string().optional(),
  salesRepName: z.string().optional(),
});

function unauthorizedTool() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: Request) {
  const expected = process.env.VOICE_RELAY_CALLBACK_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "VOICE_RELAY_CALLBACK_SECRET not configured" },
      { status: 503 }
    );
  }

  const secret = req.headers.get("x-voice-relay-secret")?.trim();
  if (!secret || secret !== expected) {
    return unauthorizedTool();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const scope = getWebhookTenantScope();

  try {
    const meeting = await bookMeeting({
      scope,
      leadId: parsed.data.leadId,
      meetingStart: parsed.data.meetingStart,
      meetingEnd: parsed.data.meetingEnd,
      timezone: parsed.data.timezone,
      campaignId: parsed.data.campaignId,
      sessionId: parsed.data.sessionId,
      salesRepName: parsed.data.salesRepName ?? "Sales Specialist",
    });

    return NextResponse.json(
      {
        meeting: {
          id: meeting.id,
          title: meeting.title,
          meetingStart: meeting.meetingStart,
          meetingEnd: meeting.meetingEnd,
          timezone: meeting.timezone,
          meetLink: meeting.meetLink,
          calendarEventId: meeting.calendarEventId,
          status: meeting.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
