import { NextResponse } from "next/server";
import { runScheduledCallExecutor } from "@/lib/calling/place-scheduled-call";

export const runtime = "nodejs";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/** Places Twilio calls for scheduled entries and due AI voice CRM tasks. */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runScheduledCallExecutor();
  return NextResponse.json({ processed: results.length, results });
}
