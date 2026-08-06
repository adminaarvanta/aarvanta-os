import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { cancelMeeting } from "@/lib/calling/book-meeting";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getSessionContext } from "@/lib/tenant/context";

type Params = { params: Promise<{ eventId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const { eventId } = await params;
  const meetings = await getCallingAgentRepository().listMeetings(ctx.scope);
  const meeting =
    meetings.find((m) => m.id === eventId || m.calendarEventId === eventId) ??
    null;
  if (!meeting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const updated = await cancelMeeting({
      scope: ctx.scope,
      meetingId: meeting.id,
    });
    return NextResponse.json({ meeting: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cancel failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
