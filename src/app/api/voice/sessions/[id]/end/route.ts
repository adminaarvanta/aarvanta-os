import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { closeCallSession } from "@/lib/calling/close-call-session";
import { spokenTurnCount } from "@/lib/calling/stale-call-session";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getSessionContext } from "@/lib/tenant/context";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const session = await getCallingAgentRepository().getSession(id, ctx.scope);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.status === "completed" || session.status === "failed") {
    return NextResponse.json({ session, alreadyClosed: true });
  }

  const outcome = spokenTurnCount(session) > 0 ? "disconnected" : "failed";
  const closed = await closeCallSession({
    scope: ctx.scope,
    session,
    outcome,
    hangup: true,
    summary:
      outcome === "disconnected"
        ? "Call ended from Live Calls."
        : "Call cancelled before it connected.",
  });

  return NextResponse.json({ session: closed, ok: true });
}
